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
import { differenceInDays, parseISO, isWithinInterval, eachDayOfInterval, addDays } from 'date-fns';

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
  conflictingRequests?: ConflictingRequest[]; // Other pending requests for same dates
  seniorityRecommendation?: string; // Seniority-based recommendation text
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

export interface ConflictingRequest {
  requestId: string;
  pilotId: string;
  pilotName: string;
  employeeId: string;
  role?: 'Captain' | 'First Officer'; // Pilot rank
  seniorityNumber: number;
  startDate: string;
  endDate: string;
  requestDate: string;
  requestType?: string; // RDO, WDO, ANNUAL, SICK, LSL, etc.
  reason?: string; // Reason for the leave request
  overlappingDays: number;
  isPriority: boolean; // true if this pilot has higher seniority than the current request
  recommendation: string; // Human-readable recommendation
  overlapType?: 'EXACT' | 'PARTIAL' | 'ADJACENT' | 'NEARBY'; // Type of date overlap
  overlapMessage?: string; // Explanation of the overlap
  spreadSuggestion?: string; // Recommendation to spread out requests
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
      minimumCaptains: 10, // 5 per hull × 2 aircraft
      minimumFirstOfficers: 10,
      numberOfAircraft: 2,
      captainsPerHull: 5,
      firstOfficersPerHull: 5,
    };
  }

  const reqs = settings.value as any;
  return {
    minimumCaptains: (reqs.minimum_captains_per_hull || 5) * (reqs.number_of_aircraft || 2),
    minimumFirstOfficers: (reqs.minimum_first_officers_per_hull || 5) * (reqs.number_of_aircraft || 2),
    numberOfAircraft: reqs.number_of_aircraft || 2,
    captainsPerHull: reqs.minimum_captains_per_hull || 5,
    firstOfficersPerHull: reqs.minimum_first_officers_per_hull || 5,
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

/**
 * Get conflicting PENDING leave requests for OVERLAPPING, ADJACENT, or NEARBY dates
 * Compares seniority to determine priority and suggests spreading requests
 * INCLUDES the current pilot in the comparison list
 */
export async function getConflictingPendingRequests(
  request: LeaveRequestCheck
): Promise<{ conflictingRequests: ConflictingRequest[]; seniorityRecommendation: string }> {
  const supabase = getSupabaseAdmin();

  // Get the current pilot's seniority
  const { data: currentPilot } = await supabase
    .from('pilots')
    .select('seniority_number, first_name, last_name, employee_id')
    .eq('id', request.pilotId)
    .single();

  if (!currentPilot) {
    return { conflictingRequests: [], seniorityRecommendation: '' };
  }

  const requestStart = parseISO(request.startDate);
  const requestEnd = parseISO(request.endDate);

  // Get all PENDING leave requests for same role with overlapping or nearby dates
  const { data: pendingRequests, error } = await supabase
    .from('leave_requests')
    .select(
      `
      id,
      pilot_id,
      start_date,
      end_date,
      request_date,
      request_type,
      reason,
      pilots!inner (
        id,
        first_name,
        last_name,
        employee_id,
        role,
        seniority_number
      )
    `
    )
    .eq('status', 'PENDING')
    .gte('end_date', request.startDate) // Ends on or after our start
    .lte('start_date', request.endDate); // Starts on or before our end

  if (error || !pendingRequests || pendingRequests.length === 0) {
    return { conflictingRequests: [], seniorityRecommendation: '' };
  }

  // Filter for same role and process ALL matching requests (including current pilot)
  const conflictingRequests: ConflictingRequest[] = pendingRequests
    .filter((req: any) => req.pilots?.role === request.pilotRole)
    .map((req: any) => {
      const pilot = req.pilots;
      const reqStart = parseISO(req.start_date);
      const reqEnd = parseISO(req.end_date);
      const isCurrentPilot = req.pilot_id === request.pilotId;
      const totalDays = differenceInDays(reqEnd, reqStart) + 1;

      // Determine overlap type and calculate spreading suggestions with specific dates
      let overlapType: 'EXACT' | 'PARTIAL' | 'ADJACENT' | 'NEARBY' = 'NEARBY';
      let overlapMessage = '';
      let spreadSuggestion = '';

      if (req.start_date === request.startDate && req.end_date === request.endDate) {
        overlapType = 'EXACT';
        overlapMessage = 'Exact same dates';

        // Suggest moving one of the requests forward or backward
        const gapDays = 7; // Minimum recommended spacing
        const alternativeStart1 = new Date(reqEnd);
        alternativeStart1.setDate(alternativeStart1.getDate() + gapDays);
        const alternativeEnd1 = new Date(alternativeStart1);
        alternativeEnd1.setDate(alternativeEnd1.getDate() + totalDays - 1);

        const alternativeStart2 = new Date(reqStart);
        alternativeStart2.setDate(alternativeStart2.getDate() - totalDays - gapDays + 1);
        const alternativeEnd2 = new Date(reqStart);
        alternativeEnd2.setDate(alternativeEnd2.getDate() - gapDays);

        spreadSuggestion = `💡 Suggested alternative dates: ${alternativeStart1.toLocaleDateString('en-AU')} - ${alternativeEnd1.toLocaleDateString('en-AU')} OR ${alternativeStart2.toLocaleDateString('en-AU')} - ${alternativeEnd2.toLocaleDateString('en-AU')}`;

      } else if (reqStart <= requestEnd && reqEnd >= requestStart) {
        overlapType = 'PARTIAL';
        const actualOverlapDays = differenceInDays(
          reqEnd < requestEnd ? reqEnd : requestEnd,
          reqStart > requestStart ? reqStart : requestStart
        ) + 1;
        overlapMessage = `${actualOverlapDays} days overlap`;

        // Suggest moving to avoid overlap
        const gapDays = 3;
        const moveAfter = new Date(requestEnd);
        moveAfter.setDate(moveAfter.getDate() + gapDays);
        const moveAfterEnd = new Date(moveAfter);
        moveAfterEnd.setDate(moveAfterEnd.getDate() + totalDays - 1);

        spreadSuggestion = `💡 To avoid overlap, suggest moving to: ${moveAfter.toLocaleDateString('en-AU')} - ${moveAfterEnd.toLocaleDateString('en-AU')} (${actualOverlapDays + gapDays} days separation)`;

      } else {
        const daysBetween = Math.abs(differenceInDays(reqStart, requestEnd));
        if (daysBetween <= 3) {
          overlapType = 'ADJACENT';
          overlapMessage = `Within ${daysBetween} days`;

          // Suggest adding more spacing
          const recommendedGap = 7;
          const betterStart = new Date(requestEnd);
          betterStart.setDate(betterStart.setDate(betterStart.getDate() + recommendedGap));
          const betterEnd = new Date(betterStart);
          betterEnd.setDate(betterEnd.getDate() + totalDays - 1);

          spreadSuggestion = `💡 Better spacing: ${betterStart.toLocaleDateString('en-AU')} - ${betterEnd.toLocaleDateString('en-AU')} (${recommendedGap} days gap)`;
        } else {
          overlapType = 'NEARBY';
          overlapMessage = `${daysBetween} days apart - Good spacing`;
        }
      }

      const isPriority = !isCurrentPilot && pilot.seniority_number < currentPilot.seniority_number;

      let recommendation = '';
      if (isCurrentPilot) {
        recommendation = `📋 This is the current request being reviewed`;
      } else if (overlapType === 'EXACT') {
        if (isPriority) {
          recommendation = `❌ EXACT SAME DATES - Has HIGHER priority (Seniority #${pilot.seniority_number} vs #${currentPilot.seniority_number}) - Approve this pilot first`;
        } else {
          recommendation = `✅ EXACT SAME DATES - Current pilot has HIGHER priority (Seniority #${currentPilot.seniority_number} vs #${pilot.seniority_number})`;
        }
      } else if (overlapType === 'PARTIAL') {
        if (isPriority) {
          recommendation = `⚠️ OVERLAPPING DATES - Has higher priority. ${spreadSuggestion}`;
        } else {
          recommendation = `⚠️ OVERLAPPING DATES - Current pilot has priority, but ${spreadSuggestion.toLowerCase()}`;
        }
      } else if (overlapType === 'ADJACENT') {
        recommendation = `📌 ADJACENT DATES - ${spreadSuggestion}`;
      } else {
        recommendation = `ℹ️ NEARBY REQUEST - Sufficient spacing between requests`;
      }

      return {
        requestId: req.id,
        pilotId: req.pilot_id,
        pilotName: `${pilot.first_name} ${pilot.last_name}`,
        employeeId: pilot.employee_id,
        role: pilot.role,
        seniorityNumber: pilot.seniority_number,
        startDate: req.start_date,
        endDate: req.end_date,
        requestDate: req.request_date,
        requestType: req.request_type,
        reason: req.reason,
        overlappingDays: totalDays,
        isPriority,
        recommendation,
        overlapType,
        overlapMessage,
        spreadSuggestion,
      };
    })
    .sort((a, b) => {
      // Priority order: Overlap Type > Rank (Captain > First Officer) > Seniority Number (lower = higher)
      const overlapPriority = { EXACT: 0, PARTIAL: 1, ADJACENT: 2, NEARBY: 3 };
      const overlapCompare = overlapPriority[a.overlapType!] - overlapPriority[b.overlapType!];
      if (overlapCompare !== 0) return overlapCompare;

      // Then by rank (Captain = 0, First Officer = 1)
      const rankPriority: Record<string, number> = { 'Captain': 0, 'First Officer': 1 };
      const rankCompare = rankPriority[a.role!] - rankPriority[b.role!];
      if (rankCompare !== 0) return rankCompare;

      // Finally by seniority number (lower = higher priority)
      return a.seniorityNumber - b.seniorityNumber;
    });

  // Generate overall seniority recommendation
  let seniorityRecommendation = '';
  const higherPriorityRequests = conflictingRequests.filter((r) => r.isPriority);

  if (higherPriorityRequests.length > 0) {
    const mostSenior = higherPriorityRequests[0];
    seniorityRecommendation = `⚠️ SENIORITY CONFLICT: ${mostSenior.pilotName} (Seniority #${mostSenior.seniorityNumber}, Employee #${mostSenior.employeeId}) has higher seniority and should be given priority for overlapping dates. Current pilot is Seniority #${currentPilot.seniority_number}.`;
  } else if (conflictingRequests.length > 0) {
    seniorityRecommendation = `✅ SENIORITY PRIORITY: Current pilot (${currentPilot.first_name} ${currentPilot.last_name}, Seniority #${currentPilot.seniority_number}) has the highest seniority among ${conflictingRequests.length} conflicting PENDING request(s).`;
  }

  return { conflictingRequests, seniorityRecommendation };
}

/**
 * Generate intelligent spreading recommendations based on seniority and rank
 * to maintain minimum pilot requirements when crew shortage exists
 */
function generateSpreadingRecommendations(
  conflictingRequests: ConflictingRequest[],
  currentRequest: LeaveRequestCheck,
  availableCaptains: number,
  availableFirstOfficers: number,
  requirements: CrewRequirements
): string {
  const role = currentRequest.pilotRole;
  const available = role === 'Captain' ? availableCaptains : availableFirstOfficers;
  const minimum = requirements.minimumCaptains; // Same for both roles (10 each)
  const shortage = minimum - available;

  // Sort conflicting requests by priority (already sorted, but ensure correct order)
  const sortedRequests = [...conflictingRequests].sort((a, b) => {
    // Rank priority: Captain > First Officer
    const rankPriority: Record<string, number> = { 'Captain': 0, 'First Officer': 1 };
    const rankCompare = rankPriority[a.role!] - rankPriority[b.role!];
    if (rankCompare !== 0) return rankCompare;

    // Seniority priority: Lower number = Higher priority
    return a.seniorityNumber - b.seniorityNumber;
  });

  // Identify the highest priority pilot (should be approved)
  const highestPriority = sortedRequests[0];

  // Safety check - should not happen but TypeScript requires it
  if (!highestPriority) {
    return 'Unable to generate recommendations - no conflicting requests found.';
  }

  // Identify pilots that should reschedule (lower priority)
  const shouldReschedule = sortedRequests.slice(1);

  // Build recommendation message
  let recommendation = `⚠️ CREW SHORTAGE RISK: Only ${available} ${role}s available after approvals, which is ${shortage} below the minimum requirement of ${minimum}.\n\n`;

  recommendation += `📋 SENIORITY-BASED SPREADING RECOMMENDATIONS:\n\n`;

  recommendation += `✅ APPROVE (Highest Priority):\n`;
  recommendation += `   • ${highestPriority.role} - Seniority #${highestPriority.seniorityNumber}: ${highestPriority.pilotName}\n`;
  recommendation += `   • Employee ID: ${highestPriority.employeeId}\n`;
  recommendation += `   • Dates: ${new Date(highestPriority.startDate).toLocaleDateString('en-AU')} to ${new Date(highestPriority.endDate).toLocaleDateString('en-AU')}\n`;
  recommendation += `   • Duration: ${highestPriority.overlappingDays} days\n`;
  if (highestPriority.reason) {
    recommendation += `   • Reason: ${highestPriority.reason}\n`;
  }
  recommendation += `   • Priority: Rank (${highestPriority.role}) + Seniority (#${highestPriority.seniorityNumber} = Most Senior)\n\n`;

  if (shouldReschedule.length > 0) {
    recommendation += `🔄 REQUEST TO RESCHEDULE (Lower Priority):\n\n`;

    shouldReschedule.forEach((pilot, index) => {
      recommendation += `   ${index + 1}. ${pilot.role} - Seniority #${pilot.seniorityNumber}: ${pilot.pilotName}\n`;
      recommendation += `      • Employee ID: ${pilot.employeeId}\n`;
      recommendation += `      • Current Request: ${new Date(pilot.startDate).toLocaleDateString('en-AU')} to ${new Date(pilot.endDate).toLocaleDateString('en-AU')} (${pilot.overlappingDays} days)\n`;

      // Generate spreading suggestion
      const spreadingOptions = generateDateSpreadingSuggestions(
        pilot.startDate,
        pilot.endDate,
        conflictingRequests
      );

      if (spreadingOptions.length > 0) {
        recommendation += `      • Suggested Alternative Dates:\n`;
        spreadingOptions.forEach((option, optIndex) => {
          recommendation += `        ${optIndex + 1}) ${option}\n`;
        });
      }

      recommendation += `      • Priority Reason: ${pilot.role === 'First Officer' ? 'Lower rank' : `Lower seniority (#${pilot.seniorityNumber})`}\n`;
      recommendation += `\n`;
    });
  }

  recommendation += `\n💡 ACTION REQUIRED:\n`;
  recommendation += `   • Approve ${highestPriority.pilotName} (highest priority) to maintain operations\n`;
  recommendation += `   • Contact ${shouldReschedule.length} lower-priority pilot(s) to discuss rescheduling options\n`;
  recommendation += `   • Ensure minimum ${minimum} ${role}s maintained at all times for fleet operations\n`;
  recommendation += `   • Consider roster periods when proposing alternative dates\n`;

  return recommendation;
}

/**
 * Generate date spreading suggestions for rescheduling
 */
function generateDateSpreadingSuggestions(
  startDate: string,
  endDate: string,
  conflictingRequests: ConflictingRequest[]
): string[] {
  const suggestions: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = differenceInDays(end, start) + 1;

  // Suggestion 1: Move 1 week earlier
  const oneWeekEarlier = addDays(start, -7);
  const oneWeekEarlierEnd = addDays(oneWeekEarlier, duration - 1);
  suggestions.push(
    `${oneWeekEarlier.toLocaleDateString('en-AU')} to ${oneWeekEarlierEnd.toLocaleDateString('en-AU')} (1 week earlier)`
  );

  // Suggestion 2: Move 1 week later
  const oneWeekLater = addDays(start, 7);
  const oneWeekLaterEnd = addDays(oneWeekLater, duration - 1);
  suggestions.push(
    `${oneWeekLater.toLocaleDateString('en-AU')} to ${oneWeekLaterEnd.toLocaleDateString('en-AU')} (1 week later)`
  );

  // Suggestion 3: Move 2 weeks later (next roster period consideration)
  const twoWeeksLater = addDays(start, 14);
  const twoWeeksLaterEnd = addDays(twoWeeksLater, duration - 1);
  suggestions.push(
    `${twoWeeksLater.toLocaleDateString('en-AU')} to ${twoWeeksLaterEnd.toLocaleDateString('en-AU')} (2 weeks later - different roster period)`
  );

  return suggestions;
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

  // Determine eligibility for THIS request
  const isEligible = conflicts.length === 0;
  const hasCriticalConflicts = conflicts.some((c) => c.severity === 'CRITICAL');

  // Get conflicting PENDING requests for same dates
  const { conflictingRequests: allConflictingRequests, seniorityRecommendation: initialSeniorityRec } =
    await getConflictingPendingRequests(request);

  // Now check if approving ALL conflicting requests would cause crew shortage
  // Only show seniority comparison if collective approval would violate minimums
  let needsSeniorityReview = false;
  let conflictingRequests: ConflictingRequest[] = [];
  let seniorityRecommendation = '';

  if (allConflictingRequests.length > 0) {
    console.log('🔍 ELIGIBILITY CHECK: Found conflicting requests', {
      count: allConflictingRequests.length,
      pilots: allConflictingRequests.map(r => `${r.pilotName} (${r.role})`),
      dates: `${request.startDate} to ${request.endDate}`
    });

    // STEP 1: Check if we have minimum crew available
    // Logic: Do we have 10 Captains AND 10 First Officers available?
    const supabase = getSupabaseAdmin();

    // Get total active pilots
    const { data: pilots } = await supabase
      .from('pilots')
      .select('id, role')
      .eq('is_active', true);

    // Get already approved leave for these dates (excluding current conflicting requests)
    const conflictingRequestIds = allConflictingRequests.map(r => r.requestId).filter(id => id);
    let existingLeaveQuery = supabase
      .from('leave_requests')
      .select(`
        id,
        pilot_id,
        pilots!inner (id, role)
      `)
      .eq('status', 'APPROVED')
      .gte('end_date', request.startDate)
      .lte('start_date', request.endDate);

    // Exclude the conflicting request IDs if any exist
    if (conflictingRequestIds.length > 0) {
      existingLeaveQuery = existingLeaveQuery.not('id', 'in', `(${conflictingRequestIds.join(',')})`);
    }

    const { data: existingLeave } = await existingLeaveQuery;

    console.log('📊 CREW DATA:', {
      conflictingRequestIds,
      existingLeaveCount: existingLeave?.length || 0
    });

    if (pilots) {
      const totalCaptains = pilots.filter((p) => p.role === 'Captain').length;
      const totalFirstOfficers = pilots.filter((p) => p.role === 'First Officer').length;

      // Count already on APPROVED leave
      const onLeaveCaptains = (existingLeave || []).filter((lr: any) => lr.pilots?.role === 'Captain').length;
      const onLeaveFirstOfficers = (existingLeave || []).filter((lr: any) => lr.pilots?.role === 'First Officer').length;

      // Calculate CURRENTLY available crew (before approving new requests)
      const availableCaptains = totalCaptains - onLeaveCaptains;
      const availableFirstOfficers = totalFirstOfficers - onLeaveFirstOfficers;

      console.log('📊 CREW AVAILABILITY:', {
        totalCaptains,
        totalFirstOfficers,
        onLeaveCaptains,
        onLeaveFirstOfficers,
        availableCaptains,
        availableFirstOfficers,
        minimumRequired: requirements.minimumCaptains,
        requestingRole: request.pilotRole
      });

      // STEP 2: Decision based on the role being requested
      // Check if we have minimum crew for the specific role requesting leave
      let hasMinimumCrewForRole = false;

      if (request.pilotRole === 'Captain') {
        // Multiple Captains requesting - check if we have minimum Captains available
        hasMinimumCrewForRole = availableCaptains >= requirements.minimumCaptains;
        console.log('🎯 CAPTAIN REQUEST:', {
          availableCaptains,
          minimumRequired: requirements.minimumCaptains,
          hasMinimumCrew: hasMinimumCrewForRole
        });
      } else if (request.pilotRole === 'First Officer') {
        // Multiple First Officers requesting - check if we have minimum First Officers available
        hasMinimumCrewForRole = availableFirstOfficers >= requirements.minimumFirstOfficers;
        console.log('🎯 FIRST OFFICER REQUEST:', {
          availableFirstOfficers,
          minimumRequired: requirements.minimumFirstOfficers,
          hasMinimumCrew: hasMinimumCrewForRole
        });
      }

      // ONLY show seniority comparison when MULTIPLE pilots are requesting same dates
      // If only ONE pilot (no conflicts), straight approve based on crew availability
      if (allConflictingRequests.length > 1) {
        console.log('👥 MULTIPLE PILOTS detected:', allConflictingRequests.length);
        conflictingRequests = allConflictingRequests;

        if (!hasMinimumCrewForRole) {
          // Below minimum crew for this role - need seniority review with spreading recommendations
          console.log('⚠️ BELOW MINIMUM CREW - Seniority review required');
          needsSeniorityReview = true;

          // Generate intelligent spreading recommendations
          seniorityRecommendation = generateSpreadingRecommendations(
            allConflictingRequests,
            request,
            availableCaptains,
            availableFirstOfficers,
            requirements
          );
        } else {
          // Sufficient crew - all can be approved, but still show the comparison
          console.log('✅ SUFFICIENT CREW - All requests can be approved');
          needsSeniorityReview = false;
          seniorityRecommendation = `✅ Sufficient ${request.pilotRole} crew available (${request.pilotRole === 'Captain' ? availableCaptains : availableFirstOfficers} available, ${requirements.minimumCaptains} minimum required). All overlapping requests can be approved without crew shortage.`;
        }
      } else {
        // Only ONE pilot requesting - straight approve based on crew availability only
        console.log('✅ SINGLE PILOT - Straight approve based on crew availability');
        conflictingRequests = [];
        needsSeniorityReview = false;
        seniorityRecommendation = '';
      }
    }
  }

  const hasHigherPriorityRequests = conflictingRequests.some((r) => r.isPriority);

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

  // Add seniority-based recommendations for conflicting pending requests
  if (seniorityRecommendation) {
    reasons.push(seniorityRecommendation);
  }

  // Add seniority-based recommendations for alternative available pilots
  if (!isEligible && alternativePilots.length > 0) {
    const available = alternativePilots.filter((p) => p.currentLeaveStatus === 'AVAILABLE');
    if (available.length > 0) {
      reasons.push(
        `📋 ${available.length} alternative ${request.pilotRole}(s) available with higher seniority`
      );
    }
  }

  // Modify recommendation if there are higher priority pending requests
  if (hasHigherPriorityRequests && !hasCriticalConflicts) {
    recommendation = 'REVIEW_REQUIRED';
  }

  return {
    isEligible,
    conflicts,
    affectedDates,
    recommendation,
    reasons,
    alternativePilots,
    crewImpact,
    conflictingRequests,
    seniorityRecommendation,
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
