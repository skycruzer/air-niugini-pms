/**
 * @fileoverview Analytics Data Service - Direct database access for analytics
 * Provides direct data fetching for analytics without HTTP calls
 * Use this service from API routes and server-side code
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import {
  differenceInYears,
  differenceInDays,
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import type { PilotAnalytics, CertificationAnalytics, LeaveAnalytics } from '@/types/analytics';

/**
 * Get comprehensive pilot analytics from database
 */
export async function getPilotAnalyticsData(): Promise<PilotAnalytics> {
  try {
    console.log('📊 Analytics Data Service: Getting pilot analytics from database...');

    const supabaseAdmin = getSupabaseAdmin();

    // Get base pilot data with additional calculations
    const { data: pilots, error } = await supabaseAdmin.from('pilots').select(`
        id,
        first_name,
        last_name,
        role,
        contract_type,
        commencement_date,
        date_of_birth,
        is_active,
        captain_qualifications,
        updated_at
      `);

    if (error) throw error;

    const activePilots = pilots?.filter((p: any) => p.is_active === true) || [];
    const today = new Date();

    // Calculate age distribution
    const ageDistribution = {
      under30: 0,
      age30to40: 0,
      age40to50: 0,
      age50to60: 0,
      over60: 0,
    };

    // Calculate seniority distribution
    const seniorityDistribution = {
      junior: 0, // 0-5 years
      mid: 0, // 5-15 years
      senior: 0, // 15+ years
    };

    // Calculate retirement planning
    const retirementPlanning = {
      retiringIn1Year: 0,
      retiringIn2Years: 0,
      retiringIn5Years: 0,
    };

    // Count role distribution
    let captains = 0;
    let firstOfficers = 0;
    let trainingCaptains = 0;
    let examiners = 0;
    let lineCaptains = 0;

    activePilots.forEach((pilot: any) => {
      // Age analysis
      if (pilot.date_of_birth) {
        const age = differenceInYears(today, new Date(pilot.date_of_birth));
        if (age < 30) ageDistribution.under30++;
        else if (age < 40) ageDistribution.age30to40++;
        else if (age < 50) ageDistribution.age40to50++;
        else if (age < 60) ageDistribution.age50to60++;
        else ageDistribution.over60++;

        // Retirement planning (assuming retirement at 65)
        const yearsToRetirement = 65 - age;
        if (yearsToRetirement <= 1) retirementPlanning.retiringIn1Year++;
        else if (yearsToRetirement <= 2) retirementPlanning.retiringIn2Years++;
        else if (yearsToRetirement <= 5) retirementPlanning.retiringIn5Years++;
      }

      // Seniority analysis
      if (pilot.commencement_date) {
        const yearsOfService = differenceInYears(today, new Date(pilot.commencement_date));
        if (yearsOfService < 5) seniorityDistribution.junior++;
        else if (yearsOfService < 15) seniorityDistribution.mid++;
        else seniorityDistribution.senior++;
      }

      // Role distribution
      if (pilot.role === 'Captain') {
        captains++;

        // Check for special qualifications
        const qualifications = pilot.captain_qualifications || {};
        if (qualifications.line_captain) lineCaptains++;
        if (qualifications.training_captain) trainingCaptains++;
        if (qualifications.examiner) examiners++;
      } else if (pilot.role === 'First Officer') {
        firstOfficers++;
      }
    });

    const result = {
      total: pilots?.length || 0,
      active: activePilots.length,
      inactive: (pilots?.length || 0) - activePilots.length,
      captains,
      firstOfficers,
      trainingCaptains,
      examiners,
      lineCaptains,
      ageDistribution,
      seniorityDistribution,
      retirementPlanning,
    };

    console.log('✅ Analytics Data Service: Successfully retrieved pilot analytics');
    return result;
  } catch (error) {
    console.error('❌ Analytics Data Service: Error getting pilot analytics:', error);
    throw error;
  }
}

/**
 * Get comprehensive certification analytics from database
 */
export async function getCertificationAnalyticsData(): Promise<CertificationAnalytics> {
  try {
    console.log('📋 Analytics Data Service: Getting certification analytics from database...');

    const supabaseAdmin = getSupabaseAdmin();

    // Get certification data with check types
    const { data: certifications, error } = await supabaseAdmin.from('pilot_checks').select(`
        id,
        pilot_id,
        check_type_id,
        expiry_date,
        check_types (
          id,
          check_code,
          check_description,
          category
        )
      `);

    if (error) throw error;

    const today = new Date();
    const certs = certifications || [];

    // Calculate status distribution
    let current = 0;
    let expiring = 0;
    let expired = 0;

    // Expiry timeline
    const expiryTimeline = {
      next7Days: 0,
      next14Days: 0,
      next30Days: 0,
      next60Days: 0,
      next90Days: 0,
    };

    // Category breakdown
    const categoryMap = new Map<
      string,
      {
        total: number;
        current: number;
        expiring: number;
        expired: number;
      }
    >();

    // Check type distribution
    const checkTypeMap = new Map<
      string,
      {
        count: number;
        pilotsAffected: Set<string>;
        expiryDates: Date[];
      }
    >();

    certs.forEach((cert: any) => {
      const expiryDate = cert.expiry_date ? new Date(cert.expiry_date) : null;
      const checkType = cert.check_types?.check_description || 'Unknown';
      const category = cert.check_types?.category || 'General';

      // Initialize category if not exists
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, current: 0, expiring: 0, expired: 0 });
      }
      const categoryStats = categoryMap.get(category)!;

      // Initialize check type if not exists
      if (!checkTypeMap.has(checkType)) {
        checkTypeMap.set(checkType, {
          count: 0,
          pilotsAffected: new Set(),
          expiryDates: [],
        });
      }
      const checkTypeStats = checkTypeMap.get(checkType)!;

      categoryStats.total++;
      checkTypeStats.count++;
      checkTypeStats.pilotsAffected.add(cert.pilot_id);

      if (expiryDate) {
        checkTypeStats.expiryDates.push(expiryDate);
        const daysToExpiry = differenceInDays(expiryDate, today);

        // Status classification
        if (daysToExpiry < 0) {
          expired++;
          categoryStats.expired++;
        } else if (daysToExpiry <= 30) {
          expiring++;
          categoryStats.expiring++;
        } else {
          current++;
          categoryStats.current++;
        }

        // Timeline classification
        if (daysToExpiry >= 0 && daysToExpiry <= 7) expiryTimeline.next7Days++;
        if (daysToExpiry >= 0 && daysToExpiry <= 14) expiryTimeline.next14Days++;
        if (daysToExpiry >= 0 && daysToExpiry <= 30) expiryTimeline.next30Days++;
        if (daysToExpiry >= 0 && daysToExpiry <= 60) expiryTimeline.next60Days++;
        if (daysToExpiry >= 0 && daysToExpiry <= 90) expiryTimeline.next90Days++;
      } else {
        // No expiry date - treat as expired
        expired++;
        categoryStats.expired++;
      }
    });

    // Convert maps to arrays
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      ...stats,
    }));

    const checkTypeDistribution = Array.from(checkTypeMap.entries()).map(([checkType, stats]) => {
      const averageDaysToExpiry =
        stats.expiryDates.length > 0
          ? stats.expiryDates.reduce((sum, date) => sum + differenceInDays(date, today), 0) /
            stats.expiryDates.length
          : 0;

      return {
        checkType,
        count: stats.count,
        pilotsAffected: stats.pilotsAffected.size,
        averageDaysToExpiry: Math.round(averageDaysToExpiry),
      };
    });

    const total = current + expiring + expired;
    const complianceRate = total > 0 ? Math.round((current / total) * 100) : 100;

    const result = {
      total,
      current,
      expiring,
      expired,
      complianceRate,
      expiryTimeline,
      categoryBreakdown,
      checkTypeDistribution,
    };

    console.log('✅ Analytics Data Service: Successfully retrieved certification analytics');
    return result;
  } catch (error) {
    console.error('❌ Analytics Data Service: Error getting certification analytics:', error);
    throw error;
  }
}

/**
 * Get leave analytics from database
 */
export async function getLeaveAnalyticsData(): Promise<LeaveAnalytics> {
  try {
    console.log('📅 Analytics Data Service: Getting leave analytics from database...');

    const supabaseAdmin = getSupabaseAdmin();

    const { data: leaveRequests, error } = await supabaseAdmin.from('leave_requests').select(`
        id,
        pilot_id,
        request_type,
        status,
        start_date,
        end_date,
        created_at,
        reviewed_at,
        pilots (
          first_name,
          last_name
        )
      `);

    if (error) throw error;

    const requests = leaveRequests || [];
    const today = new Date();
    const thisMonth = startOfMonth(today);
    const lastMonth = startOfMonth(subMonths(today, 1));

    // Basic counts
    const totalRequests = requests.length;
    const pending = requests.filter((r: any) => r.status === 'PENDING').length;
    const approved = requests.filter((r: any) => r.status === 'APPROVED').length;
    const denied = requests.filter((r: any) => r.status === 'DENIED').length;

    // Monthly counts
    const thisMonthRequests = requests.filter(
      (r: any) => new Date(r.created_at) >= thisMonth
    ).length;

    const lastMonthRequests = requests.filter((r: any) => {
      const createdAt = new Date(r.created_at);
      return createdAt >= lastMonth && createdAt < thisMonth;
    }).length;

    // Type breakdown
    const typeBreakdown = {
      RDO: requests.filter((r: any) => r.request_type === 'RDO').length,
      SDO: requests.filter((r: any) => r.request_type === 'SDO').length,
      ANNUAL: requests.filter((r: any) => r.request_type === 'ANNUAL').length,
      SICK: requests.filter((r: any) => r.request_type === 'SICK').length,
      LSL: requests.filter((r: any) => r.request_type === 'LSL').length,
      LWOP: requests.filter((r: any) => r.request_type === 'LWOP').length,
      MATERNITY: requests.filter((r: any) => r.request_type === 'MATERNITY').length,
      COMPASSIONATE: requests.filter((r: any) => r.request_type === 'COMPASSIONATE').length,
    };

    // Monthly trends (last 12 months)
    const monthlyRequests = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(monthStart);
      const monthName = format(monthStart, 'MMM yyyy');

      const monthRequests = requests.filter((r: any) => {
        const createdAt = new Date(r.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });

      monthlyRequests.push({
        month: monthName,
        total: monthRequests.length,
        approved: monthRequests.filter((r: any) => r.status === 'APPROVED').length,
        denied: monthRequests.filter((r: any) => r.status === 'DENIED').length,
      });
    }

    // Seasonal patterns (quarters)
    const seasonalPattern = [
      {
        quarter: 'Q1',
        averageRequests: Math.round(
          monthlyRequests.slice(0, 3).reduce((sum, m) => sum + m.total, 0) / 3
        ),
      },
      {
        quarter: 'Q2',
        averageRequests: Math.round(
          monthlyRequests.slice(3, 6).reduce((sum, m) => sum + m.total, 0) / 3
        ),
      },
      {
        quarter: 'Q3',
        averageRequests: Math.round(
          monthlyRequests.slice(6, 9).reduce((sum, m) => sum + m.total, 0) / 3
        ),
      },
      {
        quarter: 'Q4',
        averageRequests: Math.round(
          monthlyRequests.slice(9, 12).reduce((sum, m) => sum + m.total, 0) / 3
        ),
      },
    ];

    const result = {
      totalRequests,
      pending,
      approved,
      denied,
      thisMonth: thisMonthRequests,
      lastMonth: lastMonthRequests,
      trends: {
        monthlyRequests,
        seasonalPattern,
      },
      typeBreakdown,
    };

    console.log('✅ Analytics Data Service: Successfully retrieved leave analytics');
    return result;
  } catch (error) {
    console.error('❌ Analytics Data Service: Error getting leave analytics:', error);
    throw error;
  }
}
