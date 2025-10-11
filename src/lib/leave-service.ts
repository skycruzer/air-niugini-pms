import { supabase, getSupabaseAdmin, handleSupabaseError } from './supabase';
import { getCurrentRosterPeriod, getRosterPeriodFromDate } from './roster-utils';
import { logger } from '@/lib/logger';

export interface LeaveRequest {
  id: string;
  pilot_id: string;
  request_type: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE';
  roster_period: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  reason?: string;
  request_date?: string; // Date when the request was made (separate from created_at)
  request_method?: 'EMAIL' | 'ORACLE' | 'LEAVE_BIDS' | 'SYSTEM'; // How the request was submitted
  is_late_request?: boolean; // Flag for requests with less than 21 days advance notice
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_comments?: string;
  // Joined data
  pilot_name?: string;
  employee_id?: string;
  pilot_role?: 'Captain' | 'First Officer';
  reviewer_name?: string;
}

export interface LeaveRequestFormData {
  pilot_id: string;
  request_type: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE';
  start_date: string;
  end_date: string;
  request_date: string;
  request_method: 'ORACLE' | 'EMAIL' | 'LEAVE_BIDS' | 'SYSTEM';
  reason?: string;
  is_late_request?: boolean;
}

export interface LeaveRequestStats {
  total: number;
  pending: number;
  approved: number;
  denied: number;
  byType: {
    RDO: number;
    SDO: number;
    ANNUAL: number;
    SICK: number;
    LSL: number;
    LWOP: number;
    MATERNITY: number;
    COMPASSIONATE: number;
  };
}

// Calculate days between two dates (inclusive)
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
}

// Get all leave requests with pilot information
export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const response = await fetch('/api/leave-requests');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch leave requests');
    }

    return result.data || [];
  } catch (error) {
    logger.error('Error fetching leave requests', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Get a single leave request by ID
export async function getLeaveRequestById(requestId: string): Promise<LeaveRequest | null> {
  try {
    const { data: request, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id,
          role
        ),
        reviewer:an_users!reviewed_by (
          name
        )
      `
      )
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    if (!request) return null;

    return {
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name  } ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      pilot_role: request.pilots?.role || null,
      reviewer_name: request.reviewer?.name || null,
    };
  } catch (error) {
    logger.error('Error fetching leave request', error instanceof Error ? error : new Error(String(error)));
    throw new Error(handleSupabaseError(error));
  }
}

// Get leave requests for a specific pilot
export async function getPilotLeaveRequests(pilotId: string): Promise<LeaveRequest[]> {
  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        reviewer:an_users!reviewed_by (
          name
        )
      `
      )
      .eq('pilot_id', pilotId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (requests || []).map((request) => ({
      ...request,
      reviewer_name: request.reviewer?.name || null,
    }));
  } catch (error) {
    logger.error('Error fetching pilot leave requests', error instanceof Error ? error : new Error(String(error)));
    throw new Error(handleSupabaseError(error));
  }
}

// Create a new leave request
export async function createLeaveRequest(requestData: LeaveRequestFormData): Promise<LeaveRequest> {
  try {
    logger.debug('Creating leave request via API', requestData);

    const response = await fetch('/api/leave-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create leave request');
    }

    logger.info('Leave request created successfully', { id: result.data.id });
    return result.data;
  } catch (error) {
    logger.error('Error creating leave request', error instanceof Error ? error : new Error(String(error)));
    throw new Error(error instanceof Error ? error.message : 'Failed to create leave request');
  }
}

// Update leave request data (for editing)
export async function updateLeaveRequest(
  requestId: string,
  requestData: Partial<LeaveRequestFormData>
): Promise<LeaveRequest> {
  try {
    logger.debug('Updating leave request via API', { requestId, requestData });

    const response = await fetch('/api/leave-requests', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: requestId,
        ...requestData,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to update leave request');
    }

    logger.info('Leave request updated successfully', { id: result.data.id });
    return result.data;
  } catch (error) {
    logger.error('Error updating leave request', error instanceof Error ? error : new Error(String(error)));
    throw new Error(error instanceof Error ? error.message : 'Failed to update leave request');
  }
}

// Update leave request status (approve/deny)
export async function updateLeaveRequestStatus(
  requestId: string,
  status: 'APPROVED' | 'DENIED',
  reviewedBy: string,
  reviewComments?: string
): Promise<LeaveRequest> {
  try {
    logger.debug('Updating leave request status via API...', { requestId, status });

    const response = await fetch('/api/leave-requests', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: requestId,
        status,
        reviewed_by: reviewedBy,
        reviewer_comments: reviewComments,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to update leave request status');
    }

    logger.info('Leave request status updated successfully', { data: result.data.id });
    return result.data;
  } catch (error) {
    logger.error('Error updating leave request status', error instanceof Error ? error : new Error(String(error)));
    throw new Error(
      error instanceof Error ? error.message : 'Failed to update leave request status'
    );
  }
}

// Delete a leave request (only if pending)
export async function deleteLeaveRequest(requestId: string): Promise<void> {
  try {
    // First check if the request is pending
    const { data: request, error: fetchError } = await supabase
      .from('leave_requests')
      .select('status')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    if (request.status !== 'PENDING') {
      throw new Error('Cannot delete a leave request that has already been reviewed');
    }

    const { error } = await supabase.from('leave_requests').delete().eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    logger.error('Error deleting leave request', error instanceof Error ? error : new Error(String(error)));
    throw new Error(handleSupabaseError(error));
  }
}

// Get leave request statistics
export async function getLeaveRequestStats(): Promise<LeaveRequestStats> {
  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select('status, request_type');

    if (error) throw error;

    const stats = (requests || []).reduce(
      (acc, request) => {
        acc.total++;

        // Count by status
        if (request.status === 'PENDING') acc.pending++;
        else if (request.status === 'APPROVED') acc.approved++;
        else if (request.status === 'DENIED') acc.denied++;

        // Count by type
        acc.byType[request.request_type as keyof typeof acc.byType]++;

        return acc;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        byType: {
          RDO: 0,
          SDO: 0,
          ANNUAL: 0,
          SICK: 0,
          LSL: 0,
          LWOP: 0,
          MATERNITY: 0,
          COMPASSIONATE: 0,
        },
      }
    );

    return stats;
  } catch (error) {
    logger.error('Error fetching leave request stats', error instanceof Error ? error : new Error(String(error)));
    throw new Error(handleSupabaseError(error));
  }
}

// Get pending leave requests (for manager/admin approval)
export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id
        )
      `
      )
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true }); // Oldest first for review

    if (error) throw error;

    return (requests || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name  } ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
    }));
  } catch (error) {
    logger.error('Error fetching pending leave requests', error instanceof Error ? error : new Error(String(error)));
    throw new Error(handleSupabaseError(error));
  }
}

// Check for leave conflicts (same pilot, overlapping dates)
export async function checkLeaveConflicts(
  pilotId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<LeaveRequest[]> {
  try {
    let query = supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id
        )
      `
      )
      .eq('pilot_id', pilotId)
      .in('status', ['PENDING', 'APPROVED']).or(`
        and(start_date.lte.${endDate},end_date.gte.${startDate})
      `);

    if (excludeRequestId) {
      query = query.neq('id', excludeRequestId);
    }

    const { data: conflicts, error } = await query;

    if (error) throw error;

    return (conflicts || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name  } ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
    }));
  } catch (error) {
    logger.error('Error checking leave conflicts', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

// Get leave requests for a specific roster period
export async function getLeaveRequestsByRosterPeriod(
  rosterPeriod: string
): Promise<LeaveRequest[]> {
  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id
        ),
        reviewer:an_users!reviewed_by (
          name
        )
      `
      )
      .eq('roster_period', rosterPeriod)
      .order('start_date', { ascending: true });

    if (error) throw error;

    return (requests || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name  } ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      reviewer_name: request.reviewer?.name || null,
    }));
  } catch (error) {
    logger.error('Error fetching leave requests by roster period', error instanceof Error ? error : new Error(String(error)));
    throw new Error(handleSupabaseError(error));
  }
}

// Get leave requests for a specific roster period (Admin version - bypasses RLS)
export async function getLeaveRequestsByRosterPeriodAdmin(
  rosterPeriod: string
): Promise<LeaveRequest[]> {
  try {
    logger.debug('Admin query: Fetching leave requests for ${rosterPeriod}...');

    const { data: requests, error } = await getSupabaseAdmin()
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id
        ),
        reviewer:an_users(name)
      `
      )
      .eq('roster_period', rosterPeriod)
      .order('start_date', { ascending: true });

    if (error) {
      logger.error('Admin query error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    logger.debug('Admin query: Found ${requests?.length || 0} leave requests');

    return (requests || []).map((request: any) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name  } ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      reviewer_name: request.reviewer?.name || null,
    }));
  } catch (error) {
    logger.error('Error fetching leave requests by roster period (admin)', error instanceof Error ? error : new Error(String(error)));
    throw new Error(handleSupabaseError(error));
  }
}
