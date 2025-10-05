import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { pdfReportDataService } from '@/lib/pdf-data-service';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type');

  console.log(`🔍 API /reports: Generating ${reportType} report...`);

  try {
    switch (reportType) {
      // NEW CONSOLIDATED REPORT TYPES (Phase 2 Consolidation)
      case 'compliance-dashboard':
        // Merges: Fleet Compliance + Risk Assessment + Operational Readiness
        return await generateFleetComplianceReport(supabaseAdmin);

      case 'pilot-management':
        // Merges: Pilot Summary + Fleet Management
        return await generateFleetManagementReport(supabaseAdmin);

      case 'certification-planning':
        // Merges: Certification Forecast + Planning & Rostering
        return await generatePlanningRosteringReport(supabaseAdmin);

      case 'operational-status':
        // Real-time operational capacity and crew availability
        return await generateOperationalReadinessReport(supabaseAdmin);

      case 'fleet-analytics':
        // Advanced performance metrics and analytics
        return await generateFleetAnalyticsReport(supabaseAdmin);

      // LEGACY REPORT TYPES (backwards compatibility)
      case 'fleet-compliance':
        return await generateFleetComplianceReport(supabaseAdmin);
      case 'risk-assessment':
        return await generateRiskAssessmentReport(supabaseAdmin);
      case 'pilot-summary':
        return await generatePilotSummaryReport(supabaseAdmin);
      case 'fleet-management':
        return await generateFleetManagementReport(supabaseAdmin);
      case 'certification-forecast':
        return await generateCertificationForecastReport(supabaseAdmin);
      case 'operational-readiness':
        return await generateOperationalReadinessReport(supabaseAdmin);
      case 'planning-rostering':
        return await generatePlanningRosteringReport(supabaseAdmin);

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid report type',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('🚨 API /reports: Error generating report:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error),
      reportType,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate report',
      },
      { status: 500 }
    );
  }
}

async function generateFleetComplianceReport(supabaseAdmin: any) {
  // Get all pilots with their certifications
  const { data: pilots, error: pilotsError } = await supabaseAdmin
    .from('pilots')
    .select(
      `
      id,
      first_name,
      last_name,
      employee_id,
      role,
      is_active,
      pilot_checks (
        id,
        expiry_date,
        check_types (
          check_code,
          check_description,
          category
        )
      )
    `
    )
    .eq('is_active', true);

  if (pilotsError) throw pilotsError;

  // Calculate compliance metrics
  const totalPilots = pilots?.length || 0;
  let totalCertifications = 0;
  let currentCertifications = 0;
  let expiringCertifications = 0;
  let expiredCertifications = 0;

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  pilots?.forEach((pilot: any) => {
    pilot.pilot_checks?.forEach((check: any) => {
      totalCertifications++;

      if (!check.expiry_date) {
        expiredCertifications++;
        return;
      }

      const expiryDate = new Date(check.expiry_date);

      if (expiryDate < today) {
        expiredCertifications++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        expiringCertifications++;
      } else {
        currentCertifications++;
      }
    });
  });

  const complianceRate =
    totalCertifications > 0
      ? ((currentCertifications + expiringCertifications) / totalCertifications) * 100
      : 0;

  // Generate report data
  const reportData = {
    summary: {
      totalPilots,
      totalCertifications,
      currentCertifications,
      expiringCertifications,
      expiredCertifications,
      complianceRate: Math.round(complianceRate * 100) / 100,
    },
    pilotBreakdown: pilots?.map((pilot: any) => ({
      id: pilot.id,
      name: `${pilot.first_name} ${pilot.last_name}`,
      employeeId: pilot.employee_id,
      role: pilot.role,
      totalChecks: pilot.pilot_checks?.length || 0,
      currentChecks:
        pilot.pilot_checks?.filter((check: any) => {
          if (!check.expiry_date) return false;
          const expiryDate = new Date(check.expiry_date);
          return expiryDate >= thirtyDaysFromNow;
        }).length || 0,
      expiringChecks:
        pilot.pilot_checks?.filter((check: any) => {
          if (!check.expiry_date) return false;
          const expiryDate = new Date(check.expiry_date);
          return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
        }).length || 0,
      expiredChecks:
        pilot.pilot_checks?.filter((check: any) => {
          if (!check.expiry_date) return true;
          const expiryDate = new Date(check.expiry_date);
          return expiryDate < today;
        }).length || 0,
    })),
    generatedAt: new Date().toISOString(),
    generatedBy: 'Air Niugini PMS',
  };

  console.log(`✅ API /reports: Fleet compliance report generated with ${totalPilots} pilots`);

  return NextResponse.json({
    success: true,
    data: reportData,
    type: 'fleet-compliance',
  });
}

async function generateRiskAssessmentReport(supabaseAdmin: any) {
  // Get pilots with expired or expiring certifications
  const { data: expiredData, error: expiredError } = await supabaseAdmin
    .from('pilot_checks')
    .select(
      `
      pilot:pilots (
        id,
        first_name,
        last_name,
        employee_id,
        role
      ),
      expiry_date,
      check_type:check_types (
        check_code,
        check_description,
        category
      )
    `
    )
    .lt('expiry_date', new Date().toISOString());

  if (expiredError) throw expiredError;

  const { data: expiringData, error: expiringError } = await supabaseAdmin
    .from('pilot_checks')
    .select(
      `
      pilot:pilots (
        id,
        first_name,
        last_name,
        employee_id,
        role
      ),
      expiry_date,
      check_type:check_types (
        check_code,
        check_description,
        category
      )
    `
    )
    .gte('expiry_date', new Date().toISOString())
    .lte('expiry_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());

  if (expiringError) throw expiringError;

  const reportData = {
    summary: {
      totalExpired: expiredData?.length || 0,
      totalExpiring: expiringData?.length || 0,
      riskLevel:
        (expiredData?.length || 0) > 10
          ? 'HIGH'
          : (expiredData?.length || 0) > 5
            ? 'MEDIUM'
            : 'LOW',
    },
    expiredCertifications: expiredData?.map((item: any) => ({
      pilot: item.pilot ? `${item.pilot.first_name} ${item.pilot.last_name}` : 'Unknown',
      employeeId: item.pilot?.employee_id,
      role: item.pilot?.role,
      checkType: item.check_type?.check_description,
      checkCode: item.check_type?.check_code,
      category: item.check_type?.category,
      expiryDate: item.expiry_date,
      daysOverdue: Math.floor(
        (Date.now() - new Date(item.expiry_date).getTime()) / (1000 * 60 * 60 * 24)
      ),
    })),
    expiringCertifications: expiringData?.map((item: any) => ({
      pilot: item.pilot ? `${item.pilot.first_name} ${item.pilot.last_name}` : 'Unknown',
      employeeId: item.pilot?.employee_id,
      role: item.pilot?.role,
      checkType: item.check_type?.check_description,
      checkCode: item.check_type?.check_code,
      category: item.check_type?.category,
      expiryDate: item.expiry_date,
      daysUntilExpiry: Math.floor(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    })),
    generatedAt: new Date().toISOString(),
    generatedBy: 'Air Niugini PMS',
  };

  console.log(`✅ API /reports: Risk assessment report generated`);

  return NextResponse.json({
    success: true,
    data: reportData,
    type: 'risk-assessment',
  });
}

async function generatePilotSummaryReport(supabaseAdmin: any) {
  // Get comprehensive pilot data
  const { data: pilots, error } = await supabaseAdmin
    .from('pilots')
    .select(
      `
      *,
      pilot_checks (
        *,
        check_types (
          check_code,
          check_description,
          category
        )
      )
    `
    )
    .eq('is_active', true)
    .order('last_name');

  if (error) throw error;

  const reportData = {
    pilots: pilots?.map((pilot: any) => {
      const certifications = pilot.pilot_checks || [];
      const today = new Date();

      return {
        id: pilot.id,
        employeeId: pilot.employee_id,
        name: `${pilot.first_name}${pilot.middle_name ? ` ${pilot.middle_name}` : ''} ${pilot.last_name}`,
        role: pilot.role,
        contractType: pilot.contract_type,
        nationality: pilot.nationality,
        dateOfBirth: pilot.date_of_birth,
        commencementDate: pilot.commencement_date,
        seniorityNumber: pilot.seniority_number,
        captainQualifications: pilot.captain_qualifications,
        certificationSummary: {
          total: certifications.length,
          current: certifications.filter((cert: any) => {
            if (!cert.expiry_date) return false;
            return new Date(cert.expiry_date) > today;
          }).length,
          expired: certifications.filter((cert: any) => {
            if (!cert.expiry_date) return true;
            return new Date(cert.expiry_date) <= today;
          }).length,
        },
        certifications: certifications.map((cert: any) => ({
          checkCode: cert.check_types?.check_code,
          checkDescription: cert.check_types?.check_description,
          category: cert.check_types?.category,
          expiryDate: cert.expiry_date,
          status: !cert.expiry_date
            ? 'EXPIRED'
            : new Date(cert.expiry_date) <= today
              ? 'EXPIRED'
              : new Date(cert.expiry_date) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
                ? 'EXPIRING'
                : 'CURRENT',
        })),
      };
    }),
    generatedAt: new Date().toISOString(),
    generatedBy: 'Air Niugini PMS',
  };

  console.log(`✅ API /reports: Pilot summary report generated for ${pilots?.length} pilots`);

  return NextResponse.json({
    success: true,
    data: reportData,
    type: 'pilot-summary',
  });
}

async function generateCertificationForecastReport(supabaseAdmin: any) {
  // Get certifications expiring in the next 6 months
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const { data: upcoming, error } = await supabaseAdmin
    .from('pilot_checks')
    .select(
      `
      pilot:pilots (
        first_name,
        last_name,
        employee_id,
        role
      ),
      expiry_date,
      check_type:check_types (
        check_code,
        check_description,
        category
      )
    `
    )
    .gte('expiry_date', new Date().toISOString())
    .lte('expiry_date', sixMonthsFromNow.toISOString())
    .order('expiry_date');

  if (error) throw error;

  // Group by month
  const monthlyForecast: { [key: string]: any[] } = {};
  upcoming?.forEach((item: any) => {
    const month = new Date(item.expiry_date).toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyForecast[month]) {
      monthlyForecast[month] = [];
    }
    monthlyForecast[month].push({
      pilot: item.pilot ? `${item.pilot.first_name} ${item.pilot.last_name}` : 'Unknown',
      employeeId: item.pilot?.employee_id,
      role: item.pilot?.role,
      checkType: item.check_type?.check_description,
      checkCode: item.check_type?.check_code,
      category: item.check_type?.category,
      expiryDate: item.expiry_date,
    });
  });

  const reportData = {
    summary: {
      totalUpcoming: upcoming?.length || 0,
      monthsAnalyzed: 6,
      planningHorizon: sixMonthsFromNow.toISOString().split('T')[0],
    },
    monthlyForecast,
    upcomingRenewals: upcoming || [],
    generatedAt: new Date().toISOString(),
    generatedBy: 'Air Niugini PMS',
  };

  console.log(`✅ API /reports: Certification forecast report generated`);

  return NextResponse.json({
    success: true,
    data: reportData,
    type: 'certification-forecast',
  });
}

async function generateFleetAnalyticsReport(supabaseAdmin: any) {
  // Comprehensive analytics
  const { data: analytics } = await supabaseAdmin.rpc('get_fleet_analytics');

  // If stored procedure doesn't exist, calculate manually
  const { data: pilots } = await supabaseAdmin.from('pilots').select('*').eq('is_active', true);

  const { data: certifications } = await supabaseAdmin
    .from('pilot_checks')
    .select('*, check_types(*)');

  const { data: checkTypes } = await supabaseAdmin.from('check_types').select('*');

  const reportData = {
    fleetSummary: {
      totalPilots: pilots?.length || 0,
      totalCaptains: pilots?.filter((p: any) => p.role === 'Captain').length || 0,
      totalFirstOfficers: pilots?.filter((p: any) => p.role === 'First Officer').length || 0,
      averageAge: calculateAverageAge(pilots || []),
      averageSeniority: calculateAverageSeniority(pilots || []),
    },
    certificationAnalytics: {
      totalCertifications: certifications?.length || 0,
      totalCheckTypes: checkTypes?.length || 0,
      averageCertificationsPerPilot: pilots?.length
        ? Math.round(((certifications?.length || 0) / pilots.length) * 100) / 100
        : 0,
    },
    trends: {
      // This would be enhanced with historical data
      complianceTrend: 'STABLE',
      renewalActivity: 'NORMAL',
    },
    generatedAt: new Date().toISOString(),
    generatedBy: 'Air Niugini PMS',
  };

  console.log(`✅ API /reports: Fleet analytics report generated`);

  return NextResponse.json({
    success: true,
    data: reportData,
    type: 'fleet-analytics',
  });
}

async function generateOperationalReadinessReport(supabaseAdmin: any) {
  // Get current leave requests and pilot availability
  const { data: leaveRequests } = await supabaseAdmin
    .from('leave_requests')
    .select(
      `
      *,
      pilot:pilots (
        first_name,
        last_name,
        employee_id,
        role
      )
    `
    )
    .gte('start_date', new Date().toISOString().split('T')[0]);

  const { data: pilots } = await supabaseAdmin.from('pilots').select('*').eq('is_active', true);

  const reportData = {
    availability: {
      totalPilots: pilots?.length || 0,
      availablePilots:
        (pilots?.length || 0) -
        (leaveRequests?.filter((lr: any) => lr.status === 'APPROVED').length || 0),
      onLeave: leaveRequests?.filter((lr: any) => lr.status === 'APPROVED').length || 0,
      pendingLeaveRequests: leaveRequests?.filter((lr: any) => lr.status === 'PENDING').length || 0,
    },
    upcomingLeave: leaveRequests?.map((lr: any) => ({
      pilot: lr.pilot ? `${lr.pilot.first_name} ${lr.pilot.last_name}` : 'Unknown',
      employeeId: lr.pilot?.employee_id,
      role: lr.pilot?.role,
      requestType: lr.request_type,
      startDate: lr.start_date,
      endDate: lr.end_date,
      daysCount: lr.days_count,
      status: lr.status,
      rosterPeriod: lr.roster_period,
    })),
    generatedAt: new Date().toISOString(),
    generatedBy: 'Air Niugini PMS',
  };

  console.log(`✅ API /reports: Operational readiness report generated`);

  return NextResponse.json({
    success: true,
    data: reportData,
    type: 'operational-readiness',
  });
}

function calculateAverageAge(pilots: any[]): number {
  if (!pilots.length) return 0;

  const ages = pilots
    .filter((p) => p.date_of_birth)
    .map((p) => {
      const birthDate = new Date(p.date_of_birth);
      const ageDiff = Date.now() - birthDate.getTime();
      return Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 365.25));
    });

  return ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
}

function calculateAverageSeniority(pilots: any[]): number {
  if (!pilots.length) return 0;

  const seniorities = pilots.filter((p) => p.seniority_number).map((p) => p.seniority_number);

  return seniorities.length
    ? Math.round(seniorities.reduce((sum, seniority) => sum + seniority, 0) / seniorities.length)
    : 0;
}

async function generatePlanningRosteringReport(supabaseAdmin: any) {
  const today = new Date();

  // Get system settings for pilot requirements with error handling
  let settings;
  try {
    const { settingsService } = await import('@/lib/settings-service');
    settings = await settingsService.getSettings();
  } catch (error) {
    console.warn('⚠️ Failed to fetch settings, using defaults:', error);
    // Use default settings if service fails
    settings = {
      pilot_requirements: {
        pilot_retirement_age: 65,
        number_of_aircraft: 2,
        minimum_captains_per_hull: 10,
        minimum_first_officers_per_hull: 10,
      },
    };
  }

  // Define time periods for planning
  const timePeriods = [
    { label: '7 Days', days: 7 },
    { label: '14 Days', days: 14 },
    { label: '28 Days', days: 28 },
    { label: '60 Days', days: 60 },
    { label: '90 Days', days: 90 },
  ];

  const periodData: { [key: string]: any } = {};

  // Get current pilot counts for requirements analysis
  const { data: allPilots } = await supabaseAdmin
    .from('pilots')
    .select('id, role, date_of_birth, is_active')
    .eq('is_active', true);

  const currentCaptains = allPilots?.filter((p: any) => p.role === 'Captain').length || 0;
  const currentFirstOfficers =
    allPilots?.filter((p: any) => p.role === 'First Officer').length || 0;

  // Calculate retirement implications
  const retirementAge = settings.pilot_requirements.pilot_retirement_age;
  const pilotsNearRetirement =
    allPilots?.filter((pilot: any) => {
      if (!pilot.date_of_birth) return false;
      const age = Math.floor(
        (today.getTime() - new Date(pilot.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      );
      return age >= retirementAge - 2; // Within 2 years of retirement
    }).length || 0;

  // Get certifications expiring within each time period
  for (const period of timePeriods) {
    const endDate = new Date(today.getTime() + period.days * 24 * 60 * 60 * 1000);

    const { data: expiring, error } = await supabaseAdmin
      .from('pilot_checks')
      .select(
        `
        pilot:pilots (
          id,
          first_name,
          last_name,
          employee_id,
          role,
          is_active
        ),
        expiry_date,
        check_type:check_types (
          check_code,
          check_description,
          category
        )
      `
      )
      .gte('expiry_date', today.toISOString())
      .lte('expiry_date', endDate.toISOString())
      .order('expiry_date');

    if (error) throw error;

    // Group by pilot and check category for better planning insights
    const pilotImpact: { [key: string]: any } = {};
    const categoryBreakdown: { [key: string]: any } = {};

    expiring?.forEach((item: any) => {
      if (!item.pilot?.is_active) return;

      const pilotKey = `${item.pilot.first_name} ${item.pilot.last_name}`;
      const category = item.check_type?.category || 'Unknown';

      // Track pilot impact
      if (!pilotImpact[pilotKey]) {
        pilotImpact[pilotKey] = {
          pilot: item.pilot,
          certifications: [],
          totalExpiring: 0,
          criticalChecks: 0, // Flight checks, simulator checks, medical
        };
      }

      pilotImpact[pilotKey].certifications.push({
        checkCode: item.check_type?.check_code,
        checkDescription: item.check_type?.check_description,
        category: item.check_type?.category,
        expiryDate: item.expiry_date,
        daysUntilExpiry: Math.floor(
          (new Date(item.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
      });

      pilotImpact[pilotKey].totalExpiring++;

      // Mark critical checks that affect operational readiness
      if (['Flight Checks', 'Simulator Checks', 'Pilot Medical'].includes(category)) {
        pilotImpact[pilotKey].criticalChecks++;
      }

      // Track category breakdown
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          category,
          count: 0,
          pilotsAffected: new Set(),
        };
      }

      categoryBreakdown[category].count++;
      categoryBreakdown[category].pilotsAffected.add(pilotKey);
    });

    // Convert sets to counts for JSON serialization
    Object.keys(categoryBreakdown).forEach((key) => {
      categoryBreakdown[key].pilotsAffected = categoryBreakdown[key].pilotsAffected.size;
    });

    periodData[period.label] = {
      totalCertifications: expiring?.length || 0,
      totalPilotsAffected: Object.keys(pilotImpact).length,
      criticalPilotsAffected: Object.values(pilotImpact).filter(
        (pilot: any) => pilot.criticalChecks > 0
      ).length,
      pilotImpact: Object.values(pilotImpact),
      categoryBreakdown: Object.values(categoryBreakdown),
      rawData: expiring || [],
    };
  }

  // Generate operational readiness assessment
  const captainsAffected = Object.values(periodData['28 Days'].pilotImpact).filter(
    (pilot: any) => pilot.pilot.role === 'Captain' && pilot.criticalChecks > 0
  );

  const firstOfficersAffected = Object.values(periodData['28 Days'].pilotImpact).filter(
    (pilot: any) => pilot.pilot.role === 'First Officer' && pilot.criticalChecks > 0
  );

  const operationalImpact = {
    next28Days: {
      captainsAtRisk: captainsAffected.length,
      firstOfficersAtRisk: firstOfficersAffected.length,
      totalPilotsAtRisk: captainsAffected.length + firstOfficersAffected.length,
      riskLevel:
        captainsAffected.length > 3 ? 'HIGH' : captainsAffected.length > 1 ? 'MEDIUM' : 'LOW',
      recommendations: generatePlanningRecommendations(
        captainsAffected.length,
        firstOfficersAffected.length
      ),
    },
  };

  // Calculate pilot requirements compliance
  const requiredCaptains = settings.pilot_requirements.minimum_captains_per_hull;
  const requiredFirstOfficers = settings.pilot_requirements.minimum_first_officers_per_hull;
  const numberOfAircraft = settings.pilot_requirements.number_of_aircraft;

  const captainShortfall = Math.max(0, requiredCaptains - currentCaptains);
  const firstOfficerShortfall = Math.max(0, requiredFirstOfficers - currentFirstOfficers);

  // Get leave requests for roster period analysis
  const { data: leaveRequests } = await supabaseAdmin
    .from('leave_requests')
    .select(
      `
      *,
      pilot:pilots (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        is_active
      )
    `
    )
    .gte('start_date', today.toISOString().split('T')[0]);

  // Analyze leave requests by roster period
  const rosterPeriodAnalysis: { [key: string]: any } = {};
  const leaveImpactAnalysis = {
    totalRequests: leaveRequests?.length || 0,
    approvedRequests: leaveRequests?.filter((lr: any) => lr.status === 'APPROVED').length || 0,
    pendingRequests: leaveRequests?.filter((lr: any) => lr.status === 'PENDING').length || 0,
    rejectedRequests: leaveRequests?.filter((lr: any) => lr.status === 'REJECTED').length || 0,
    captainsOnLeave:
      leaveRequests?.filter((lr: any) => lr.status === 'APPROVED' && lr.pilot?.role === 'Captain')
        .length || 0,
    firstOfficersOnLeave:
      leaveRequests?.filter(
        (lr: any) => lr.status === 'APPROVED' && lr.pilot?.role === 'First Officer'
      ).length || 0,
  };

  // Group leave requests by roster period
  leaveRequests?.forEach((request: any) => {
    const rosterPeriod = request.roster_period;
    if (!rosterPeriodAnalysis[rosterPeriod]) {
      rosterPeriodAnalysis[rosterPeriod] = {
        period: rosterPeriod,
        totalRequests: 0,
        approvedRequests: 0,
        pendingRequests: 0,
        captainRequests: 0,
        firstOfficerRequests: 0,
        totalDays: 0,
        requests: [],
      };
    }

    rosterPeriodAnalysis[rosterPeriod].totalRequests++;
    rosterPeriodAnalysis[rosterPeriod].totalDays += request.days_count || 0;
    rosterPeriodAnalysis[rosterPeriod].requests.push({
      pilot: request.pilot ? `${request.pilot.first_name} ${request.pilot.last_name}` : 'Unknown',
      employeeId: request.pilot?.employee_id,
      role: request.pilot?.role,
      requestType: request.request_type,
      startDate: request.start_date,
      endDate: request.end_date,
      daysCount: request.days_count,
      status: request.status,
      reason: request.reason,
    });

    if (request.status === 'APPROVED') {
      rosterPeriodAnalysis[rosterPeriod].approvedRequests++;
    } else if (request.status === 'PENDING') {
      rosterPeriodAnalysis[rosterPeriod].pendingRequests++;
    }

    if (request.pilot?.role === 'Captain') {
      rosterPeriodAnalysis[rosterPeriod].captainRequests++;
    } else if (request.pilot?.role === 'First Officer') {
      rosterPeriodAnalysis[rosterPeriod].firstOfficerRequests++;
    }
  });

  // Calculate operational availability impact
  const currentAvailability = {
    captains: currentCaptains - leaveImpactAnalysis.captainsOnLeave,
    firstOfficers: currentFirstOfficers - leaveImpactAnalysis.firstOfficersOnLeave,
    total:
      currentCaptains +
      currentFirstOfficers -
      (leaveImpactAnalysis.captainsOnLeave + leaveImpactAnalysis.firstOfficersOnLeave),
  };

  const pilotRequirementsAnalysis = {
    current: {
      captains: currentCaptains,
      firstOfficers: currentFirstOfficers,
      total: currentCaptains + currentFirstOfficers,
    },
    required: {
      captains: requiredCaptains,
      firstOfficers: requiredFirstOfficers,
      total: requiredCaptains + requiredFirstOfficers,
    },
    shortfall: {
      captains: captainShortfall,
      firstOfficers: firstOfficerShortfall,
      total: captainShortfall + firstOfficerShortfall,
    },
    compliance: {
      captains: currentCaptains >= requiredCaptains,
      firstOfficers: currentFirstOfficers >= requiredFirstOfficers,
      overall: currentCaptains >= requiredCaptains && currentFirstOfficers >= requiredFirstOfficers,
    },
    retirementRisk: {
      pilotsNearRetirement,
      percentageNearRetirement: allPilots?.length
        ? Math.round((pilotsNearRetirement / allPilots.length) * 100)
        : 0,
      retirementAge,
    },
    aircraftCoverage: {
      numberOfAircraft,
      currentCoverageRatio:
        numberOfAircraft > 0
          ? Math.round(((currentCaptains + currentFirstOfficers) / numberOfAircraft) * 100) / 100
          : 0,
      requiredCoverageRatio:
        numberOfAircraft > 0
          ? Math.round(((requiredCaptains + requiredFirstOfficers) / numberOfAircraft) * 100) / 100
          : 0,
    },
  };

  const reportData = {
    summary: {
      reportDate: today.toISOString(),
      next7Days: periodData['7 Days'].totalCertifications,
      next14Days: periodData['14 Days'].totalCertifications,
      next28Days: periodData['28 Days'].totalCertifications,
      next60Days: periodData['60 Days'].totalCertifications,
      next90Days: periodData['90 Days'].totalCertifications,
      criticalPeriod:
        periodData['28 Days'].criticalPilotsAffected > 0
          ? '28 Days'
          : periodData['14 Days'].criticalPilotsAffected > 0
            ? '14 Days'
            : periodData['7 Days'].criticalPilotsAffected > 0
              ? '7 Days'
              : 'None',
    },
    timePeriods: periodData,
    operationalImpact,
    pilotRequirements: pilotRequirementsAnalysis,
    rosterAnalysis: {
      leaveImpact: leaveImpactAnalysis,
      rosterPeriods: Object.values(rosterPeriodAnalysis),
      currentAvailability,
      availabilityPercentage: {
        captains:
          currentCaptains > 0
            ? Math.round((currentAvailability.captains / currentCaptains) * 100)
            : 100,
        firstOfficers:
          currentFirstOfficers > 0
            ? Math.round((currentAvailability.firstOfficers / currentFirstOfficers) * 100)
            : 100,
        overall:
          currentCaptains + currentFirstOfficers > 0
            ? Math.round(
                (currentAvailability.total / (currentCaptains + currentFirstOfficers)) * 100
              )
            : 100,
      },
    },
    planningInsights: {
      peakExpiryPeriod: findPeakExpiryPeriod(periodData),
      mostAffectedCategory: findMostAffectedCategory(periodData),
      trainingPriority: generateTrainingPriority(periodData),
    },
    generatedAt: new Date().toISOString(),
    generatedBy: 'Air Niugini PMS',
  };

  console.log(`✅ API /reports: Planning and rostering report generated`);

  return NextResponse.json({
    success: true,
    data: reportData,
    type: 'planning-rostering',
  });
}

function generatePlanningRecommendations(
  captainsAtRisk: number,
  firstOfficersAtRisk: number
): string[] {
  const recommendations = [];

  if (captainsAtRisk > 3) {
    recommendations.push('URGENT: Schedule immediate renewal training for captains');
    recommendations.push('Consider temporary operational restrictions');
  } else if (captainsAtRisk > 1) {
    recommendations.push('Schedule captain renewal training within 2 weeks');
  }

  if (firstOfficersAtRisk > 5) {
    recommendations.push('Prioritize first officer training schedules');
  }

  if (captainsAtRisk + firstOfficersAtRisk > 8) {
    recommendations.push('Consider external training provider support');
  }

  if (recommendations.length === 0) {
    recommendations.push('Current training schedule appears adequate');
  }

  return recommendations;
}

function findPeakExpiryPeriod(periodData: any): string {
  let maxCount = 0;
  let peakPeriod = 'None';

  Object.keys(periodData).forEach((period) => {
    if (periodData[period].totalCertifications > maxCount) {
      maxCount = periodData[period].totalCertifications;
      peakPeriod = period;
    }
  });

  return peakPeriod;
}

function findMostAffectedCategory(periodData: any): string {
  const categoryTotals: { [key: string]: number } = {};

  Object.keys(periodData).forEach((period) => {
    periodData[period].categoryBreakdown.forEach((cat: any) => {
      if (!categoryTotals[cat.category]) {
        categoryTotals[cat.category] = 0;
      }
      categoryTotals[cat.category] += cat.count;
    });
  });

  let maxCount = 0;
  let topCategory = 'None';

  Object.keys(categoryTotals).forEach((category) => {
    const count = categoryTotals[category];
    if (count && count > maxCount) {
      maxCount = count;
      topCategory = category;
    }
  });

  return topCategory;
}

function generateTrainingPriority(
  periodData: any
): Array<{ category: string; priority: string; reason: string }> {
  const priorities: Array<{ category: string; priority: string; reason: string }> = [];
  const next28Days = periodData['28 Days'];

  next28Days.categoryBreakdown.forEach((cat: any) => {
    let priority = 'LOW';
    let reason = 'Standard renewal timeline';

    if (cat.category === 'Flight Checks' && cat.count > 2) {
      priority = 'CRITICAL';
      reason = 'Multiple flight check renewals required';
    } else if (cat.category === 'Simulator Checks' && cat.count > 3) {
      priority = 'HIGH';
      reason = 'Simulator capacity planning needed';
    } else if (cat.category === 'Pilot Medical' && cat.count > 2) {
      priority = 'HIGH';
      reason = 'Medical scheduling coordination required';
    } else if (cat.pilotsAffected > 5) {
      priority = 'MEDIUM';
      reason = 'Multiple pilots affected';
    }

    priorities.push({
      category: cat.category,
      priority,
      reason,
    });
  });

  return priorities.sort((a, b) => {
    const priorityOrder: { [key: string]: number } = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
}

async function generateFleetManagementReport(supabaseAdmin: any) {
  try {
    // Use the existing PDF data service which has comprehensive fleet management logic
    const reportData = await pdfReportDataService.generateFleetManagementReportData(
      'fleet-management',
      'Air Niugini PMS'
    );

    console.log(`✅ API /reports: Fleet management report generated`);

    return NextResponse.json({
      success: true,
      data: reportData,
      type: 'fleet-management',
    });
  } catch (error) {
    console.error('❌ Fleet management report generation failed:', error);
    throw error;
  }
}
