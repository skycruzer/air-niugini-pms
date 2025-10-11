/**
 * Pilot Leave Request Service
 * Handles leave request submissions from pilots
 */

import { getSupabaseAdmin } from './supabase';
import { getRosterPeriodFromDate } from './roster-utils';
import { differenceInDays } from 'date-fns';
import type { Database } from '@/types/supabase';

type LeaveRequest = Database['public']['Tables']['leave_requests']['Row'];
type LeaveRequestInsert = Database['public']['Tables']['leave_requests']['Insert'];

export interface PilotLeaveRequestData {
  request_type: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE';
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface PilotLeaveRequestWithDetails extends LeaveRequest {
  pilot_name?: string;
  pilot_role?: string;
  employee_id?: string;
  reviewer_name?: string;
}

/**
 * Calculate days between two dates (inclusive)
 */
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Submit a leave request from a pilot
 */
export async function submitPilotLeaveRequest(
  pilotUserId: string,
  requestData: PilotLeaveRequestData
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Step 1: Get pilot_users record to find pilot_id
    const { data: pilotUser, error: pilotUserError } = await supabaseAdmin
      .from('pilot_users')
      .select('employee_id, registration_approved')
      .eq('id', pilotUserId)
      .single();

    if (pilotUserError || !pilotUser) {
      return {
        success: false,
        error: 'Pilot user not found',
      };
    }

    if (!pilotUser.registration_approved) {
      return {
        success: false,
        error: 'Your registration is not approved yet',
      };
    }

    // Step 2: Get pilot record from pilots table
    const { data: pilot, error: pilotError } = await supabaseAdmin
      .from('pilots')
      .select('id')
      .eq('employee_id', pilotUser.employee_id)
      .single();

    if (pilotError || !pilot) {
      return {
        success: false,
        error: 'Pilot record not found',
      };
    }

    // Step 3: Validate dates
    const startDate = new Date(requestData.start_date);
    const endDate = new Date(requestData.end_date);
    const today = new Date();

    if (endDate < startDate) {
      return {
        success: false,
        error: 'End date must be after start date',
      };
    }

    // Step 4: Get roster period for validation
    const rosterPeriod = getRosterPeriodFromDate(startDate);

    // Step 5: Check if request is late (less than 21 days advance notice)
    const daysUntilStart = differenceInDays(startDate, today);
    const isLateRequest = daysUntilStart < 21;

    // Step 6: Calculate days count
    const daysCount = calculateDays(requestData.start_date, requestData.end_date);

    // Step 7: Create leave request
    const leaveRequestData: LeaveRequestInsert = {
      pilot_id: pilot.id,
      pilot_user_id: pilotUserId,
      submission_type: 'pilot',
      request_type: requestData.request_type,
      roster_period: rosterPeriod.code,
      start_date: requestData.start_date,
      end_date: requestData.end_date,
      days_count: daysCount,
      status: 'PENDING',
      reason: requestData.reason,
      request_date: new Date().toISOString().split('T')[0],
      request_method: 'SYSTEM',
      is_late_request: isLateRequest,
    };

    const { data: newRequest, error: insertError } = await supabaseAdmin
      .from('leave_requests')
      .insert(leaveRequestData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating leave request:', insertError);
      return {
        success: false,
        error: 'Failed to create leave request. Please try again.',
      };
    }

    console.log('✅ Pilot leave request created:', newRequest.id);

    return {
      success: true,
      requestId: newRequest.id,
    };
  } catch (error) {
    console.error('Error in submitPilotLeaveRequest:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get all leave requests for a specific pilot user
 */
export async function getPilotLeaveRequests(
  pilotUserId: string
): Promise<PilotLeaveRequestWithDetails[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: requests, error } = await supabaseAdmin
      .from('leave_requests')
      .select(
        `
        *,
        pilots!inner (
          first_name,
          last_name,
          employee_id,
          role
        ),
        reviewer:an_users (
          name
        )
      `
      )
      .eq('pilot_user_id', pilotUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pilot leave requests:', error);
      throw error;
    }

    return (requests || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.last_name}`
        : 'Unknown',
      pilot_role: request.pilots?.role,
      employee_id: request.pilots?.employee_id,
      reviewer_name: request.reviewer?.name || null,
    }));
  } catch (error) {
    console.error('Error in getPilotLeaveRequests:', error);
    throw error;
  }
}

/**
 * Cancel a pending leave request (pilot can only cancel their own pending requests)
 */
export async function cancelPilotLeaveRequest(
  pilotUserId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Step 1: Verify request belongs to pilot and is pending
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('leave_requests')
      .select('id, pilot_user_id, status')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return {
        success: false,
        error: 'Leave request not found',
      };
    }

    if (request.pilot_user_id !== pilotUserId) {
      return {
        success: false,
        error: 'You can only cancel your own leave requests',
      };
    }

    if (request.status !== 'PENDING') {
      return {
        success: false,
        error: `Cannot cancel ${request.status.toLowerCase()} leave request`,
      };
    }

    // Step 2: Delete the request
    const { error: deleteError } = await supabaseAdmin
      .from('leave_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Error canceling leave request:', deleteError);
      return {
        success: false,
        error: 'Failed to cancel leave request',
      };
    }

    console.log('✅ Pilot leave request canceled:', requestId);

    return { success: true };
  } catch (error) {
    console.error('Error in cancelPilotLeaveRequest:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
