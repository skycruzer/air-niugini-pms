/**
 * Air Niugini Leave Management Tools for Claude Agent SDK
 *
 * Provides tools for managing and querying leave requests and roster periods
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../src/lib/supabase-admin';
import { getCurrentRosterPeriod, getRosterPeriodByCode } from '../../src/lib/roster-utils';
import { differenceInDays } from 'date-fns';

/**
 * Get leave requests with filtering options
 */
export const getLeaveRequestsTool = tool({
  name: 'get_leave_requests',
  description: 'Get leave requests with optional filtering by status, roster period, or pilot',
  parameters: z.object({
    status: z
      .enum(['Pending', 'Approved', 'Rejected', 'all'])
      .optional()
      .describe('Filter by request status'),
    roster_period: z.string().optional().describe('Filter by roster period code (e.g., RP11/2025)'),
    pilot_id: z.string().optional().describe('Filter by specific pilot ID'),
    include_pilot_details: z.boolean().optional().describe('Include full pilot information'),
  }),
  execute: async ({ status, roster_period, pilot_id, include_pilot_details = true }) => {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('leave_requests')
      .select(
        include_pilot_details
          ? `
            *,
            pilots!inner (
              id,
              employee_id,
              first_name,
              last_name,
              role,
              seniority_number
            )
          `
          : '*'
      )
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (roster_period) {
      query = query.eq('roster_period', roster_period);
    }

    if (pilot_id) {
      query = query.eq('pilot_id', pilot_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch leave requests: ${error.message}`);
    }

    return {
      success: true,
      count: data.length,
      leave_requests: data,
      summary: {
        pending: data.filter((r) => r.status === 'Pending').length,
        approved: data.filter((r) => r.status === 'Approved').length,
        rejected: data.filter((r) => r.status === 'Rejected').length,
      },
    };
  },
});

/**
 * Get current roster period information
 */
export const getCurrentRosterPeriodTool = tool({
  name: 'get_current_roster_period',
  description: 'Get information about the current 28-day roster period',
  parameters: z.object({}),
  execute: async () => {
    const currentPeriod = getCurrentRosterPeriod();
    const today = new Date();
    const daysRemaining = differenceInDays(currentPeriod.endDate, today);

    return {
      success: true,
      current_roster: {
        ...currentPeriod,
        days_remaining: daysRemaining,
        is_final_review_period: daysRemaining <= 22,
      },
    };
  },
});

/**
 * Check crew availability for a specific date range
 */
export const checkCrewAvailabilityTool = tool({
  name: 'check_crew_availability',
  description:
    'Check crew availability for a specific date range, ensuring minimum 10 Captains and 10 First Officers',
  parameters: z.object({
    start_date: z.string().describe('Start date in YYYY-MM-DD format'),
    end_date: z.string().describe('End date in YYYY-MM-DD format'),
    exclude_request_id: z
      .string()
      .optional()
      .describe('Exclude a specific leave request from calculations'),
  }),
  execute: async ({ start_date, end_date, exclude_request_id }) => {
    const supabase = getSupabaseAdmin();

    // Get total active pilots by role
    const { data: pilots, error: pilotsError } = await supabase
      .from('pilots')
      .select('id, role, status')
      .eq('status', 'Active');

    if (pilotsError) {
      throw new Error(`Failed to fetch pilots: ${pilotsError.message}`);
    }

    const totalCaptains = pilots.filter((p) => p.role === 'Captain').length;
    const totalFirstOfficers = pilots.filter((p) => p.role === 'First Officer').length;

    // Get approved leave requests for the date range
    let leaveQuery = supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots!inner (role)
      `
      )
      .eq('status', 'Approved')
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (exclude_request_id) {
      leaveQuery = leaveQuery.neq('id', exclude_request_id);
    }

    const { data: approvedLeave, error: leaveError } = await leaveQuery;

    if (leaveError) {
      throw new Error(`Failed to fetch leave requests: ${leaveError.message}`);
    }

    // Calculate available crew
    const captainsOnLeave = approvedLeave.filter((r: any) => r.pilots.role === 'Captain').length;
    const firstOfficersOnLeave = approvedLeave.filter(
      (r: any) => r.pilots.role === 'First Officer'
    ).length;

    const availableCaptains = totalCaptains - captainsOnLeave;
    const availableFirstOfficers = totalFirstOfficers - firstOfficersOnLeave;

    const MIN_CREW = 10;

    return {
      success: true,
      date_range: { start_date, end_date },
      crew_availability: {
        captains: {
          total: totalCaptains,
          on_leave: captainsOnLeave,
          available: availableCaptains,
          meets_minimum: availableCaptains >= MIN_CREW,
          minimum_required: MIN_CREW,
        },
        first_officers: {
          total: totalFirstOfficers,
          on_leave: firstOfficersOnLeave,
          available: availableFirstOfficers,
          meets_minimum: availableFirstOfficers >= MIN_CREW,
          minimum_required: MIN_CREW,
        },
      },
      overall_status:
        availableCaptains >= MIN_CREW && availableFirstOfficers >= MIN_CREW
          ? 'sufficient'
          : 'insufficient',
    };
  },
});

/**
 * Detect conflicting leave requests
 */
export const detectLeaveConflictsTool = tool({
  name: 'detect_leave_conflicts',
  description: 'Detect conflicting leave requests for a specific pilot and date range',
  parameters: z.object({
    pilot_id: z.string().describe('Pilot ID to check conflicts for'),
    start_date: z.string().describe('Start date in YYYY-MM-DD format'),
    end_date: z.string().describe('End date in YYYY-MM-DD format'),
    exclude_request_id: z
      .string()
      .optional()
      .describe('Exclude a specific request from conflict detection'),
  }),
  execute: async ({ pilot_id, start_date, end_date, exclude_request_id }) => {
    const supabase = getSupabaseAdmin();

    // Get pilot information with role
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, role, seniority_number')
      .eq('id', pilot_id)
      .single();

    if (pilotError) {
      throw new Error(`Failed to fetch pilot: ${pilotError.message}`);
    }

    // Find conflicting requests from pilots of the SAME RANK
    let conflictQuery = supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots!inner (
          id,
          employee_id,
          first_name,
          last_name,
          role,
          seniority_number
        )
      `
      )
      .eq('pilots.role', pilot.role) // Same rank only
      .neq('pilot_id', pilot_id) // Different pilot
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`) // Overlapping dates
      .in('status', ['Pending', 'Approved']);

    if (exclude_request_id) {
      conflictQuery = conflictQuery.neq('id', exclude_request_id);
    }

    const { data: conflicts, error: conflictError } = await conflictQuery;

    if (conflictError) {
      throw new Error(`Failed to detect conflicts: ${conflictError.message}`);
    }

    // Sort conflicts by seniority (lower number = higher priority)
    const sortedConflicts = conflicts.sort((a: any, b: any) => {
      if (a.pilots.seniority_number !== b.pilots.seniority_number) {
        return a.pilots.seniority_number - b.pilots.seniority_number;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return {
      success: true,
      pilot,
      date_range: { start_date, end_date },
      has_conflicts: sortedConflicts.length > 0,
      conflict_count: sortedConflicts.length,
      conflicts: sortedConflicts,
      seniority_comparison: sortedConflicts.map((conflict: any) => ({
        pilot_name: `${conflict.pilots.first_name} ${conflict.pilots.last_name}`,
        employee_id: conflict.pilots.employee_id,
        seniority_number: conflict.pilots.seniority_number,
        has_priority: conflict.pilots.seniority_number < pilot.seniority_number,
        request_status: conflict.status,
      })),
    };
  },
});

/**
 * Get pending leave requests requiring final review
 */
export const getPendingFinalReviewTool = tool({
  name: 'get_pending_final_review',
  description: 'Get pending leave requests that require final review before the next roster period',
  parameters: z.object({
    roster_period_code: z
      .string()
      .optional()
      .describe('Specific roster period code (defaults to next period)'),
  }),
  execute: async ({ roster_period_code }) => {
    const supabase = getSupabaseAdmin();

    // Determine roster period
    let targetPeriod;
    if (roster_period_code) {
      targetPeriod = getRosterPeriodByCode(roster_period_code);
    } else {
      const current = getCurrentRosterPeriod();
      // Calculate next period (28 days after current end date)
      const nextStart = new Date(current.endDate);
      nextStart.setDate(nextStart.getDate() + 1);
      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextEnd.getDate() + 27);

      targetPeriod = {
        code: `RP${current.number + 1}/${current.year}`,
        startDate: nextStart,
        endDate: nextEnd,
      };
    }

    // Get pending requests for this period
    const { data, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots!inner (
          id,
          employee_id,
          first_name,
          last_name,
          role,
          seniority_number
        )
      `
      )
      .eq('status', 'Pending')
      .eq('roster_period', targetPeriod.code)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch pending requests: ${error.message}`);
    }

    const today = new Date();
    const daysUntilPeriodStart = differenceInDays(targetPeriod.startDate, today);

    return {
      success: true,
      roster_period: targetPeriod,
      days_until_period_start: daysUntilPeriodStart,
      is_urgent: daysUntilPeriodStart <= 7,
      pending_count: data.length,
      pending_requests: data,
      by_role: {
        captains: data.filter((r) => r.pilots.role === 'Captain').length,
        first_officers: data.filter((r) => r.pilots.role === 'First Officer').length,
      },
    };
  },
});
