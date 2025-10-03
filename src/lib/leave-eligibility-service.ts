/**
 * LEAVE ELIGIBILITY SERVICE
 *
 * Comprehensive service for checking leave request eligibility based on:
 * - Minimum crew requirements (Captains and First Officers)
 * - Conflicting leave requests for the same period
 * - Seniority-based recommendations
 * - Aircraft fleet requirements
 *
 * Business Rules:
 * - Minimum crew must be maintained at all times per aircraft
 * - Senior pilots (lower seniority number) have priority
 * - Leave requests are evaluated against approved + pending requests
 * - Real-time conflict detection for overlapping dates
 *
 * Created: 2025-10-03
 * Purpose: Ensure operational crew requirements while managing leave requests
 */

import { getSupabaseAdmin } from './supabase';
import { differenceInDays, parseISO, isWithinInterval, eachDayOfInterval } from 'date-fns';

// ===================================
// TYPES & INTERFACES
// ===================================

export interface CrewRequirements {
  minimumCaptains: number;
  minimumFirstOfficers: number;
  numberOfAircraft: number;
  captainsPerHull: number;
  firstOfficersPerHull: number;
}

export interface CrewAvailability {
  date: string;
  availableCaptains: number;
  availableFirstOfficers: number;
  onLeaveCaptains: number;
  onLeaveFirstOfficers: number;
  totalCaptains: number;
  totalFirstOfficers: number;
  meetsMinimum: boolean;
  captainsShortfall: number; // Negative if below minimum
  firstOfficersShortfall: number;
}

export interface LeaveEligibilityCheck {
  isEligible: boolean;
  conflicts: LeaveConflict[];
  affectedDates: string[]; // Dates that would violate minimum requirements
  recommendation: 'APPROVE' | 'DENY' | 'REVIEW_REQUIRED';
  reasons: string[];
  alternativePilots: PilotRecommendation[]; // Based on seniority
  crewImpact: CrewAvailability[];
}

export interface LeaveConflict {
  date: string;
  availableCaptains: number;
  availableFirstOfficers: number;
  requiredCaptains: number;
  requiredFirstOfficers: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
}

export interface PilotRecommendation {
  pilotId: string;
  pilotName: string;
  employeeId: string;
  role: 'Captain' | 'First Officer';
  seniorityNumber: number;
  currentLeaveStatus: 'AVAILABLE' | 'ON_LEAVE' | 'PENDING_LEAVE';
  priority: number; // 1 = highest priority (most senior available)
  reason: string;
}

export interface LeaveRequestCheck {
  requestId?: string; // Omit for new requests
  pilotId: string;
  pilotRole: 'Captain' | 'First Officer';
  startDate: string;
  endDate: string;
  requestType: string;
}

// ===================================
// CREW REQUIREMENTS
// ===================================

/**
 * Get minimum crew requirements from settings
 */
export async function getCrewRequirements(): Promise<CrewRequirements> {
  const supabase = getSupabaseAdmin();

  const { data: settings, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pilot_requirements')
    .single();

  if (error || !settings) {
    // Default fallback values based on current system
    return {
      minimumCaptains: 14, // 7 per hull × 2 aircraft
      minimumFirstOfficers: 14,
      numberOfAircraft: 2,
      captainsPerHull: 7,
      firstOfficersPerHull: 7,
    };
  }

  const reqs = settings.value as any;
  return {
    minimumCaptains: (reqs.minimum_captains_per_hull || 7) * (reqs.number_of_aircraft || 2),
    minimumFirstOfficers: (reqs.minimum_first_officers_per_hull || 7) * (reqs.number_of_aircraft || 2),
    numberOfAircraft: reqs.number_of_aircraft || 2,
    captainsPerHull: reqs.minimum_captains_per_hull || 7,
    firstOfficersPerHull: reqs.minimum_first_officers_per_hull || 7,
  };
}

// ===================================
// CREW AVAILABILITY CALCULATIONS
// ===================================

/**
 * Calculate crew availability for a specific date range
 * Considers approved and pending leave requests
 */
export async function calculateCrewAvailability(
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<CrewAvailability[]> {
  const supabase = getSupabaseAdmin();
  const requirements = await getCrewRequirements();

  // Get all active pilots by role
  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, role')
    .eq('is_active', true);

  if (pilotsError || !pilots) {
    throw new Error('Failed to fetch pilots data');
  }

  const totalCaptains = pilots.filter((p) => p.role === 'Captain').length;
  const totalFirstOfficers = pilots.filter((p) => p.role === 'First Officer').length;

  // Get all leave requests that overlap with the date range
  // Include both APPROVED and PENDING requests
  const { data: leaveRequests, error: leaveError } = await supabase
    .from('leave_requests')
    .select(
      `
      id,
      pilot_id,
      start_date,
      end_date,
      status,
      pilots!inner (id, role)
    `
    )
    .in('status', ['APPROVED', 'PENDING'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (leaveError) {
    throw new Error('Failed to fetch leave requests');
  }

  // Filter out the request being checked (for updates)
  const relevantLeave = (leaveRequests || []).filter((lr) => lr.id !== excludeRequestId);

  // Calculate availability for each day in the range
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const availability: CrewAvailability[] = days.map((day) => {
    const dateStr = day.toISOString().split('T')[0];

    // Count pilots on leave for this specific date
    const onLeaveToday = relevantLeave.filter((lr) => {
      const leaveStart = parseISO(lr.start_date);
      const leaveEnd = parseISO(lr.end_date);
      return isWithinInterval(day, { start: leaveStart, end: leaveEnd });
    });

    const onLeaveCaptains = onLeaveToday.filter(
      (lr) => (lr.pilots as any)?.role === 'Captain'
    ).length;
    const onLeaveFirstOfficers = onLeaveToday.filter(
      (lr) => (lr.pilots as any)?.role === 'First Officer'
    ).length;

    const availableCaptains = totalCaptains - onLeaveCaptains;
    const availableFirstOfficers = totalFirstOfficers - onLeaveFirstOfficers;

    const captainsShortfall = availableCaptains - requirements.minimumCaptains;
    const firstOfficersShortfall = availableFirstOfficers - requirements.minimumFirstOfficers;

    return {
      date: dateStr,
      availableCaptains,
      availableFirstOfficers,
      onLeaveCaptains,
      onLeaveFirstOfficers,
      totalCaptains,
      totalFirstOfficers,
      meetsMinimum: captainsShortfall >= 0 && firstOfficersShortfall >= 0,
      captainsShortfall,
      firstOfficersShortfall,
    };
  });

  return availability;
}

// ===================================
// LEAVE ELIGIBILITY CHECKING
// ===================================

/**
 * Check if a leave request is eligible based on crew requirements
 * Returns detailed analysis with conflicts, recommendations, and reasons
 */
export async function checkLeaveEligibility(
  request: LeaveRequestCheck
): Promise<LeaveEligibilityCheck> {
  const requirements = await getCrewRequirements();

  // Calculate crew availability if this request is approved
  const crewImpact = await calculateCrewAvailability(
    request.startDate,
    request.endDate,
    request.requestId
  );

  // Identify conflicts (days where minimum requirements would be violated)
  const conflicts: LeaveConflict[] = [];
  const affectedDates: string[] = [];

  crewImpact.forEach((day) => {
    const isCaptainRequest = request.pilotRole === 'Captain';
    const isFirstOfficerRequest = request.pilotRole === 'First Officer';

    // Calculate what availability would be if this request is approved
    const projectedCaptains = isCaptainRequest
      ? day.availableCaptains - 1
      : day.availableCaptains;
    const projectedFirstOfficers = isFirstOfficerRequest
      ? day.availableFirstOfficers - 1
      : day.availableFirstOfficers;

    const captainViolation = projectedCaptains < requirements.minimumCaptains;
    const firstOfficerViolation = projectedFirstOfficers < requirements.minimumFirstOfficers;

    if (captainViolation || firstOfficerViolation) {
      affectedDates.push(day.date);

      const severity: 'CRITICAL' | 'WARNING' | 'INFO' =
        projectedCaptains < requirements.captainsPerHull ||
        projectedFirstOfficers < requirements.firstOfficersPerHull
          ? 'CRITICAL'
          : 'WARNING';

      let message = `${day.date}: `;
      const issues: string[] = [];

      if (captainViolation) {
        const shortage = requirements.minimumCaptains - projectedCaptains;
        issues.push(
          `${shortage} Captain${shortage > 1 ? 's' : ''} below minimum (${projectedCaptains}/${requirements.minimumCaptains})`
        );
      }

      if (firstOfficerViolation) {
        const shortage = requirements.minimumFirstOfficers - projectedFirstOfficers;
        issues.push(
          `${shortage} First Officer${shortage > 1 ? 's' : ''} below minimum (${projectedFirstOfficers}/${requirements.minimumFirstOfficers})`
        );
      }

      message += issues.join(', ');

      conflicts.push({
        date: day.date,
        availableCaptains: projectedCaptains,
        availableFirstOfficers: projectedFirstOfficers,
        requiredCaptains: requirements.minimumCaptains,
        requiredFirstOfficers: requirements.minimumFirstOfficers,
        severity,
        message,
      });
    }
  });

  // Get alternative pilot recommendations based on seniority
  const alternativePilots = await getAlternativePilotRecommendations(
    request.pilotRole,
    request.startDate,
    request.endDate,
    request.pilotId
  );

  // Determine eligibility and recommendation
  const isEligible = conflicts.length === 0;
  const hasCriticalConflicts = conflicts.some((c) => c.severity === 'CRITICAL');

  let recommendation: 'APPROVE' | 'DENY' | 'REVIEW_REQUIRED';
  const reasons: string[] = [];

  if (isEligible) {
    recommendation = 'APPROVE';
    reasons.push('✅ No conflicts with minimum crew requirements');
    reasons.push(
      `Available crew after approval: ${crewImpact[0]?.availableCaptains - (request.pilotRole === 'Captain' ? 1 : 0)} Captains, ${crewImpact[0]?.availableFirstOfficers - (request.pilotRole === 'First Officer' ? 1 : 0)} First Officers`
    );
  } else if (hasCriticalConflicts) {
    recommendation = 'DENY';
    reasons.push('❌ Critical crew shortage - fleet operations would be impacted');
    reasons.push(
      `${conflicts.filter((c) => c.severity === 'CRITICAL').length} critical conflict(s) detected`
    );
    reasons.push(
      `Affected dates: ${affectedDates.slice(0, 3).join(', ')}${affectedDates.length > 3 ? ` +${affectedDates.length - 3} more` : ''}`
    );
  } else {
    recommendation = 'REVIEW_REQUIRED';
    reasons.push('⚠️  Potential crew shortage - management review recommended');
    reasons.push(`${conflicts.length} warning(s) detected for minimum crew levels`);
  }

  // Add seniority-based recommendations
  if (!isEligible && alternativePilots.length > 0) {
    const available = alternativePilots.filter((p) => p.currentLeaveStatus === 'AVAILABLE');
    if (available.length > 0) {
      reasons.push(
        `📋 ${available.length} alternative ${request.pilotRole}(s) available with higher seniority`
      );
    }
  }

  return {
    isEligible,
    conflicts,
    affectedDates,
    recommendation,
    reasons,
    alternativePilots,
    crewImpact,
  };
}

// ===================================
// SENIORITY-BASED RECOMMENDATIONS
// ===================================

/**
 * Get alternative pilot recommendations based on seniority
 * Returns pilots of the same role, sorted by seniority
 */
export async function getAlternativePilotRecommendations(
  role: 'Captain' | 'First Officer',
  startDate: string,
  endDate: string,
  excludePilotId: string
): Promise<PilotRecommendation[]> {
  const supabase = getSupabaseAdmin();

  // Get all pilots of the same role
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select(
      `
      id,
      first_name,
      last_name,
      employee_id,
      role,
      seniority_number
    `
    )
    .eq('role', role)
    .eq('is_active', true)
    .neq('id', excludePilotId)
    .order('seniority_number', { ascending: true, nullsFirst: false });

  if (error || !pilots) {
    return [];
  }

  // Get leave status for each pilot in the date range
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('pilot_id, start_date, end_date, status')
    .in(
      'pilot_id',
      pilots.map((p) => p.id)
    )
    .in('status', ['APPROVED', 'PENDING'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  // Build recommendations
  const recommendations: PilotRecommendation[] = pilots.map((pilot, index) => {
    const pilotLeave = (leaveRequests || []).filter((lr) => lr.pilot_id === pilot.id);

    let status: 'AVAILABLE' | 'ON_LEAVE' | 'PENDING_LEAVE' = 'AVAILABLE';
    if (pilotLeave.some((lr) => lr.status === 'APPROVED')) {
      status = 'ON_LEAVE';
    } else if (pilotLeave.some((lr) => lr.status === 'PENDING')) {
      status = 'PENDING_LEAVE';
    }

    let reason = '';
    if (status === 'AVAILABLE') {
      reason = `Senior ${role} (Seniority #${pilot.seniority_number || 'N/A'}) - Available for duty`;
    } else if (status === 'ON_LEAVE') {
      reason = `Currently on approved leave during this period`;
    } else {
      reason = `Has pending leave request for this period`;
    }

    return {
      pilotId: pilot.id,
      pilotName: `${pilot.first_name} ${pilot.last_name}`,
      employeeId: pilot.employee_id,
      role: pilot.role as 'Captain' | 'First Officer',
      seniorityNumber: pilot.seniority_number || 9999,
      currentLeaveStatus: status,
      priority: index + 1, // Based on seniority order
      reason,
    };
  });

  return recommendations;
}

// ===================================
// BULK ELIGIBILITY CHECKING
// ===================================

/**
 * Check multiple leave requests and return priority recommendations
 * Useful for reviewing all pending requests for a roster period
 */
export async function checkBulkLeaveEligibility(
  rosterPeriod: string
): Promise<{
  eligible: string[]; // Request IDs
  requiresReview: string[];
  shouldDeny: string[];
  recommendations: Map<string, LeaveEligibilityCheck>;
}> {
  const supabase = getSupabaseAdmin();

  // Get all pending requests for the roster period
  const { data: requests, error } = await supabase
    .from('leave_requests')
    .select(
      `
      id,
      pilot_id,
      start_date,
      end_date,
      request_type,
      pilots!inner (role)
    `
    )
    .eq('roster_period', rosterPeriod)
    .eq('status', 'PENDING')
    .order('start_date', { ascending: true });

  if (error || !requests) {
    return {
      eligible: [],
      requiresReview: [],
      shouldDeny: [],
      recommendations: new Map(),
    };
  }

  const recommendations = new Map<string, LeaveEligibilityCheck>();
  const eligible: string[] = [];
  const requiresReview: string[] = [];
  const shouldDeny: string[] = [];

  // Check each request
  for (const req of requests) {
    const check = await checkLeaveEligibility({
      requestId: req.id,
      pilotId: req.pilot_id,
      pilotRole: (req.pilots as any).role,
      startDate: req.start_date,
      endDate: req.end_date,
      requestType: req.request_type,
    });

    recommendations.set(req.id, check);

    if (check.recommendation === 'APPROVE') {
      eligible.push(req.id);
    } else if (check.recommendation === 'REVIEW_REQUIRED') {
      requiresReview.push(req.id);
    } else {
      shouldDeny.push(req.id);
    }
  }

  return {
    eligible,
    requiresReview,
    shouldDeny,
    recommendations,
  };
}
