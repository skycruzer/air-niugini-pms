import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { differenceInDays } from 'date-fns';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.debug('📋 API /analytics/certification: Getting certification analytics...');

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

    logger.info(' API /analytics/certification: Successfully retrieved certification analytics');
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(' API /analytics/certification: Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get certification analytics' },
      { status: 500 }
    );
  }
}
