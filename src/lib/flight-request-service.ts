/**
 * @fileoverview Flight Request Service Layer
 * Handles all flight request operations with proper error handling and business logic
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-15
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type FlightRequestType =
  | 'FLIGHT_ASSIGNMENT'
  | 'ROUTE_QUALIFICATION'
  | 'TYPE_RATING'
  | 'LINE_CHECK'
  | 'SIM_TRAINING'
  | 'STANDBY'
  | 'POSITION_CHANGE'
  | 'BASE_CHANGE'
  | 'OTHER';

export type FlightRequestStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type FlightRequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface FlightRequest {
  id: string;
  pilot_id: string;
  request_type: FlightRequestType;
  flight_number?: string;
  route?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_date?: string;
  return_date?: string;
  priority: FlightRequestPriority;
  status: FlightRequestStatus;
  reason?: string;
  notes?: string;
  attachments?: any[];
  required_qualifications?: any[];
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  // Relations
  pilot?: any;
  reviewer?: any;
  creator?: any;
}

export interface FlightRequestFilters {
  status?: FlightRequestStatus;
  priority?: FlightRequestPriority;
  request_type?: FlightRequestType;
  pilot_id?: string;
  created_by?: string;
  departure_date_from?: string;
  departure_date_to?: string;
}

export interface CreateFlightRequestData {
  pilot_id: string;
  request_type: FlightRequestType;
  flight_number?: string;
  route?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_date?: string;
  return_date?: string;
  priority?: FlightRequestPriority;
  reason?: string;
  notes?: string;
  attachments?: any[];
  required_qualifications?: any[];
}

export interface UpdateFlightRequestData {
  request_type?: FlightRequestType;
  flight_number?: string;
  route?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_date?: string;
  return_date?: string;
  priority?: FlightRequestPriority;
  status?: FlightRequestStatus;
  reason?: string;
  notes?: string;
  attachments?: any[];
  required_qualifications?: any[];
}

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/**
 * Get all flight requests with optional filters
 */
export async function getFlightRequests(
  filters: FlightRequestFilters = {}
): Promise<FlightRequest[]> {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('flight_requests')
      .select(
        `
        *,
        pilot:pilots!pilot_id (
          id,
          employee_id,
          first_name,
          last_name,
          role,
          is_active
        ),
        reviewer:an_users!reviewed_by (
          id,
          name,
          email,
          role
        ),
        creator:an_users!created_by (
          id,
          name,
          email,
          role
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.request_type) {
      query = query.eq('request_type', filters.request_type);
    }
    if (filters.pilot_id) {
      query = query.eq('pilot_id', filters.pilot_id);
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    if (filters.departure_date_from) {
      query = query.gte('departure_date', filters.departure_date_from);
    }
    if (filters.departure_date_to) {
      query = query.lte('departure_date', filters.departure_date_to);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching flight requests:', error);
      throw new Error('Failed to fetch flight requests');
    }

    return data as FlightRequest[];
  } catch (error) {
    logger.error('Error in getFlightRequests:', error);
    throw error;
  }
}

/**
 * Get a single flight request by ID
 */
export async function getFlightRequestById(id: string): Promise<FlightRequest | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('flight_requests')
      .select(
        `
        *,
        pilot:pilots!pilot_id (
          id,
          employee_id,
          first_name,
          last_name,
          role,
          is_active,
          nationality,
          commencement_date
        ),
        reviewer:an_users!reviewed_by (
          id,
          name,
          email,
          role
        ),
        creator:an_users!created_by (
          id,
          name,
          email,
          role
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Error fetching flight request:', error);
      throw new Error('Failed to fetch flight request');
    }

    return data as FlightRequest;
  } catch (error) {
    logger.error('Error in getFlightRequestById:', error);
    throw error;
  }
}

/**
 * Create a new flight request
 */
export async function createFlightRequest(
  data: CreateFlightRequestData,
  createdBy: string
): Promise<FlightRequest> {
  try {
    const supabase = getSupabaseAdmin();

    // Validate pilot exists
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('id, is_active')
      .eq('id', data.pilot_id)
      .single();

    if (pilotError || !pilot) {
      throw new Error('Pilot not found');
    }

    if (!pilot.is_active) {
      throw new Error('Cannot create request for inactive pilot');
    }

    // Create the request
    const requestData = {
      ...data,
      priority: data.priority || 'NORMAL',
      status: 'PENDING' as FlightRequestStatus,
      created_by: createdBy,
      attachments: data.attachments || [],
      required_qualifications: data.required_qualifications || [],
    };

    const { data: newRequest, error } = await supabase
      .from('flight_requests')
      .insert(requestData)
      .select(
        `
        *,
        pilot:pilots!pilot_id (
          id,
          employee_id,
          first_name,
          last_name,
          role
        )
      `
      )
      .single();

    if (error) {
      logger.error('Error creating flight request:', error);
      throw new Error('Failed to create flight request');
    }

    logger.info('Flight request created successfully', { id: newRequest.id });
    return newRequest as FlightRequest;
  } catch (error) {
    logger.error('Error in createFlightRequest:', error);
    throw error;
  }
}

/**
 * Update an existing flight request
 */
export async function updateFlightRequest(
  id: string,
  data: UpdateFlightRequestData,
  userId: string
): Promise<FlightRequest> {
  try {
    const supabase = getSupabaseAdmin();

    // Check if request exists
    const existing = await getFlightRequestById(id);
    if (!existing) {
      throw new Error('Flight request not found');
    }

    // Only allow updates to pending requests unless it's a status change
    if (existing.status !== 'PENDING' && !data.status) {
      throw new Error('Can only update pending requests');
    }

    const { data: updated, error } = await supabase
      .from('flight_requests')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        pilot:pilots!pilot_id (
          id,
          employee_id,
          first_name,
          last_name,
          role
        )
      `
      )
      .single();

    if (error) {
      logger.error('Error updating flight request:', error);
      throw new Error('Failed to update flight request');
    }

    logger.info('Flight request updated successfully', { id });
    return updated as FlightRequest;
  } catch (error) {
    logger.error('Error in updateFlightRequest:', error);
    throw error;
  }
}

/**
 * Approve a flight request
 */
export async function approveFlightRequest(
  id: string,
  userId: string,
  reviewNotes?: string
): Promise<FlightRequest> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('flight_requests')
      .update({
        status: 'APPROVED' as FlightRequestStatus,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
      })
      .eq('id', id)
      .select(
        `
        *,
        pilot:pilots!pilot_id (
          id,
          employee_id,
          first_name,
          last_name,
          role
        )
      `
      )
      .single();

    if (error) {
      logger.error('Error approving flight request:', error);
      throw new Error('Failed to approve flight request');
    }

    logger.info('Flight request approved', { id, userId });
    return data as FlightRequest;
  } catch (error) {
    logger.error('Error in approveFlightRequest:', error);
    throw error;
  }
}

/**
 * Reject a flight request
 */
export async function rejectFlightRequest(
  id: string,
  userId: string,
  reviewNotes: string
): Promise<FlightRequest> {
  try {
    const supabase = getSupabaseAdmin();

    if (!reviewNotes) {
      throw new Error('Review notes are required when rejecting a request');
    }

    const { data, error } = await supabase
      .from('flight_requests')
      .update({
        status: 'REJECTED' as FlightRequestStatus,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
      })
      .eq('id', id)
      .select(
        `
        *,
        pilot:pilots!pilot_id (
          id,
          employee_id,
          first_name,
          last_name,
          role
        )
      `
      )
      .single();

    if (error) {
      logger.error('Error rejecting flight request:', error);
      throw new Error('Failed to reject flight request');
    }

    logger.info('Flight request rejected', { id, userId });
    return data as FlightRequest;
  } catch (error) {
    logger.error('Error in rejectFlightRequest:', error);
    throw error;
  }
}

/**
 * Cancel a flight request
 */
export async function cancelFlightRequest(
  id: string,
  userId: string,
  reason: string
): Promise<FlightRequest> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('flight_requests')
      .update({
        status: 'CANCELLED' as FlightRequestStatus,
        cancelled_by: userId,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', id)
      .select(
        `
        *,
        pilot:pilots!pilot_id (
          id,
          employee_id,
          first_name,
          last_name,
          role
        )
      `
      )
      .single();

    if (error) {
      logger.error('Error cancelling flight request:', error);
      throw new Error('Failed to cancel flight request');
    }

    logger.info('Flight request cancelled', { id, userId });
    return data as FlightRequest;
  } catch (error) {
    logger.error('Error in cancelFlightRequest:', error);
    throw error;
  }
}

/**
 * Delete a flight request (admin only)
 */
export async function deleteFlightRequest(id: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from('flight_requests').delete().eq('id', id);

    if (error) {
      logger.error('Error deleting flight request:', error);
      throw new Error('Failed to delete flight request');
    }

    logger.info('Flight request deleted', { id });
  } catch (error) {
    logger.error('Error in deleteFlightRequest:', error);
    throw error;
  }
}

/**
 * Get flight request statistics
 */
export async function getFlightRequestStatistics(filters: {
  pilot_id?: string;
  date_from?: string;
  date_to?: string;
}) {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from('flight_requests').select('status, priority, request_type');

    if (filters.pilot_id) {
      query = query.eq('pilot_id', filters.pilot_id);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching statistics:', error);
      throw new Error('Failed to fetch statistics');
    }

    // Calculate statistics
    const stats = {
      total: data.length,
      by_status: {
        PENDING: data.filter((r) => r.status === 'PENDING').length,
        UNDER_REVIEW: data.filter((r) => r.status === 'UNDER_REVIEW').length,
        APPROVED: data.filter((r) => r.status === 'APPROVED').length,
        REJECTED: data.filter((r) => r.status === 'REJECTED').length,
        COMPLETED: data.filter((r) => r.status === 'COMPLETED').length,
        CANCELLED: data.filter((r) => r.status === 'CANCELLED').length,
      },
      by_priority: {
        LOW: data.filter((r) => r.priority === 'LOW').length,
        NORMAL: data.filter((r) => r.priority === 'NORMAL').length,
        HIGH: data.filter((r) => r.priority === 'HIGH').length,
        URGENT: data.filter((r) => r.priority === 'URGENT').length,
      },
      by_type: {} as Record<string, number>,
    };

    // Count by type
    data.forEach((r) => {
      stats.by_type[r.request_type] = (stats.by_type[r.request_type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error('Error in getFlightRequestStatistics:', error);
    throw error;
  }
}
