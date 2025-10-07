/**
 * @fileoverview Disciplinary matters service layer
 * Handles all business logic for pilot disciplinary tracking
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { getSupabaseAdmin } from './supabase';

// Get admin client instance for server-side operations
const supabase = getSupabaseAdmin();

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface IncidentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  severity_level: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  requires_review: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisciplinaryMatter {
  id: string;
  pilot_id: string;
  incident_type_id: string;
  incident_date: string;
  reported_by: string;
  reported_date: string;
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'CLOSED' | 'APPEALED';
  title: string;
  description: string;
  location?: string;
  flight_number?: string;
  aircraft_registration?: string;
  witnesses: any[];
  evidence_files: any[];
  corrective_actions?: string;
  resolution_notes?: string;
  assigned_to?: string;
  due_date?: string;
  resolved_date?: string;
  resolved_by?: string;
  impact_on_operations?: string;
  regulatory_notification_required: boolean;
  regulatory_body?: string;
  notification_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DisciplinaryAction {
  id: string;
  matter_id: string;
  action_type:
    | 'WARNING'
    | 'SUSPENSION'
    | 'TRAINING'
    | 'COUNSELING'
    | 'TERMINATION'
    | 'FINE'
    | 'OTHER';
  action_date: string;
  effective_date?: string;
  expiry_date?: string;
  description: string;
  issued_by: string;
  acknowledged_by_pilot: boolean;
  acknowledgment_date?: string;
  appeal_deadline?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'APPEALED' | 'REVERSED';
  created_at: string;
  updated_at: string;
}

export interface DisciplinaryComment {
  id: string;
  matter_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateDisciplinaryMatterInput {
  pilot_id: string;
  incident_type_id: string;
  incident_date: string;
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  title: string;
  description: string;
  location?: string;
  flight_number?: string;
  aircraft_registration?: string;
  witnesses?: any[];
  evidence_files?: any[];
  assigned_to?: string;
  due_date?: string;
  regulatory_notification_required?: boolean;
  regulatory_body?: string;
}

export interface UpdateDisciplinaryMatterInput {
  status?: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'CLOSED' | 'APPEALED';
  corrective_actions?: string;
  resolution_notes?: string;
  assigned_to?: string;
  due_date?: string;
  resolved_date?: string;
  impact_on_operations?: string;
  regulatory_body?: string;
  notification_date?: string;
}

// =============================================================================
// INCIDENT TYPES
// =============================================================================

/**
 * Retrieves all incident types
 */
export async function getIncidentTypes(): Promise<IncidentType[]> {
  const { data, error } = await supabase
    .from('incident_types')
    .select('*')
    .order('severity_level', { ascending: false })
    .order('name');

  if (error) {
    console.error('Error fetching incident types:', error);
    throw new Error('Failed to fetch incident types');
  }

  return data || [];
}

/**
 * Retrieves a single incident type by ID
 */
export async function getIncidentTypeById(id: string): Promise<IncidentType | null> {
  const { data, error } = await supabase.from('incident_types').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching incident type:', error);
    return null;
  }

  return data;
}

// =============================================================================
// DISCIPLINARY MATTERS - CRUD OPERATIONS
// =============================================================================

/**
 * SECURITY NOTE: Service functions use admin client to bypass RLS for performance.
 * Authentication and authorization MUST be enforced at the API route level using withAuth middleware.
 * These functions should NEVER be called from unauthenticated contexts.
 */

/**
 * Retrieves all disciplinary matters with related data
 * @security Called from authenticated API routes only. No user context needed for READ operations.
 */
export async function getDisciplinaryMatters(filters?: {
  pilot_id?: string;
  status?: string;
  severity?: string;
  assigned_to?: string;
}) {
  let query = supabase
    .from('disciplinary_matters')
    .select(
      `
      *,
      pilot:pilots (id, first_name, last_name, employee_id, role),
      incident_type:incident_types (id, code, name, severity_level),
      reporter:an_users!disciplinary_matters_reported_by_fkey (id, name, email),
      assignee:an_users!disciplinary_matters_assigned_to_fkey (id, name, email)
    `
    )
    .order('created_at', { ascending: false });

  if (filters?.pilot_id) {
    query = query.eq('pilot_id', filters.pilot_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching disciplinary matters:', error);
    throw new Error('Failed to fetch disciplinary matters');
  }

  return data || [];
}

/**
 * Retrieves a single disciplinary matter by ID
 */
export async function getDisciplinaryMatterById(id: string) {
  const { data, error } = await supabase
    .from('disciplinary_matters')
    .select(
      `
      *,
      pilot:pilots (id, first_name, last_name, employee_id, role, date_of_birth),
      incident_type:incident_types (id, code, name, severity_level, description),
      reporter:an_users!disciplinary_matters_reported_by_fkey (id, name, email),
      assignee:an_users!disciplinary_matters_assigned_to_fkey (id, name, email),
      resolver:an_users!disciplinary_matters_resolved_by_fkey (id, name, email)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching disciplinary matter:', error);
    throw new Error('Failed to fetch disciplinary matter');
  }

  return data;
}

/**
 * Creates a new disciplinary matter
 * @param input Disciplinary matter data to create
 * @param reportedBy User ID of the authenticated user reporting the matter (REQUIRED)
 * @security Must be called from authenticated API route with user context
 */
export async function createDisciplinaryMatter(
  input: CreateDisciplinaryMatterInput,
  reportedBy: string
) {
  // Security assertion: Ensure user context is provided
  if (!reportedBy) {
    throw new Error('Authorization required: reportedBy user ID must be provided');
  }
  const { data, error } = await supabase
    .from('disciplinary_matters')
    .insert({
      ...input,
      reported_by: reportedBy,
      witnesses: input.witnesses || [],
      evidence_files: input.evidence_files || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating disciplinary matter:', error);
    throw new Error('Failed to create disciplinary matter');
  }

  // Log audit trail
  await logDisciplinaryAudit(data.id, reportedBy, 'CREATE', null, null, null);

  return data;
}

/**
 * Updates an existing disciplinary matter
 * @param id Disciplinary matter ID to update
 * @param input Update data
 * @param userId User ID of the authenticated user making the update (REQUIRED)
 * @security Must be called from authenticated API route with user context
 */
export async function updateDisciplinaryMatter(
  id: string,
  input: UpdateDisciplinaryMatterInput,
  userId: string
) {
  // Security assertion: Ensure user context is provided
  if (!userId) {
    throw new Error('Authorization required: userId must be provided');
  }

  // Get current state for audit log
  const current = await getDisciplinaryMatterById(id);

  const { data, error } = await supabase
    .from('disciplinary_matters')
    .update({
      ...input,
      resolved_by: input.status === 'RESOLVED' || input.status === 'CLOSED' ? userId : undefined,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating disciplinary matter:', error);
    throw new Error('Failed to update disciplinary matter');
  }

  // Log audit trail for changed fields
  for (const [key, value] of Object.entries(input)) {
    if (current[key] !== value) {
      await logDisciplinaryAudit(
        id,
        userId,
        'UPDATE',
        key,
        String(current[key] || ''),
        String(value || '')
      );
    }
  }

  return data;
}

/**
 * Deletes a disciplinary matter
 * @param id Disciplinary matter ID to delete
 * @param userId User ID of the authenticated user performing the deletion (REQUIRED)
 * @security Must be called from authenticated API route. Only admins should be able to delete disciplinary matters.
 */
export async function deleteDisciplinaryMatter(id: string, userId: string) {
  // Security assertion: Ensure user context is provided
  if (!userId) {
    throw new Error('Authorization required: userId must be provided');
  }
  const { error } = await supabase.from('disciplinary_matters').delete().eq('id', id);

  if (error) {
    console.error('Error deleting disciplinary matter:', error);
    throw new Error('Failed to delete disciplinary matter');
  }

  await logDisciplinaryAudit(id, userId, 'DELETE', null, null, null);
}

// =============================================================================
// DISCIPLINARY ACTIONS
// =============================================================================

/**
 * Retrieves all actions for a disciplinary matter
 */
export async function getDisciplinaryActions(matterId: string) {
  const { data, error } = await supabase
    .from('disciplinary_actions')
    .select(
      `
      *,
      issuer:an_users!disciplinary_actions_issued_by_fkey (id, name, email)
    `
    )
    .eq('matter_id', matterId)
    .order('action_date', { ascending: false });

  if (error) {
    console.error('Error fetching disciplinary actions:', error);
    throw new Error('Failed to fetch disciplinary actions');
  }

  return data || [];
}

/**
 * Creates a new disciplinary action
 * @param matterId Disciplinary matter ID
 * @param action Action details
 * @param issuedBy User ID of the authenticated user issuing the action (REQUIRED)
 * @security Must be called from authenticated API route with user context
 */
export async function createDisciplinaryAction(
  matterId: string,
  action: {
    action_type:
      | 'WARNING'
      | 'SUSPENSION'
      | 'TRAINING'
      | 'COUNSELING'
      | 'TERMINATION'
      | 'FINE'
      | 'OTHER';
    action_date: string;
    effective_date?: string;
    expiry_date?: string;
    description: string;
    appeal_deadline?: string;
  },
  issuedBy: string
) {
  // Security assertion: Ensure user context is provided
  if (!issuedBy) {
    throw new Error('Authorization required: issuedBy user ID must be provided');
  }
  const { data, error } = await supabase
    .from('disciplinary_actions')
    .insert({
      matter_id: matterId,
      ...action,
      issued_by: issuedBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating disciplinary action:', error);
    throw new Error('Failed to create disciplinary action');
  }

  return data;
}

// =============================================================================
// DISCIPLINARY COMMENTS
// =============================================================================

/**
 * Retrieves all comments for a disciplinary matter
 */
export async function getDisciplinaryComments(matterId: string) {
  const { data, error } = await supabase
    .from('disciplinary_comments')
    .select(
      `
      *,
      user:an_users (id, name, email)
    `
    )
    .eq('matter_id', matterId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching disciplinary comments:', error);
    throw new Error('Failed to fetch disciplinary comments');
  }

  return data || [];
}

/**
 * Creates a new comment on a disciplinary matter
 */
export async function createDisciplinaryComment(
  matterId: string,
  comment: string,
  userId: string,
  isInternal: boolean = true,
  attachments: any[] = []
) {
  const { data, error } = await supabase
    .from('disciplinary_comments')
    .insert({
      matter_id: matterId,
      user_id: userId,
      comment,
      is_internal: isInternal,
      attachments,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating disciplinary comment:', error);
    throw new Error('Failed to create comment');
  }

  return data;
}

// =============================================================================
// AUDIT LOG
// =============================================================================

/**
 * Logs an audit trail entry for disciplinary matter changes
 */
async function logDisciplinaryAudit(
  matterId: string,
  userId: string,
  action: string,
  fieldChanged: string | null,
  oldValue: string | null,
  newValue: string | null
) {
  const { error } = await supabase.from('disciplinary_audit_log').insert({
    matter_id: matterId,
    user_id: userId,
    action,
    field_changed: fieldChanged,
    old_value: oldValue,
    new_value: newValue,
  });

  if (error) {
    console.error('Error logging disciplinary audit:', error);
  }
}

/**
 * Retrieves audit log for a disciplinary matter
 */
export async function getDisciplinaryAuditLog(matterId: string) {
  const { data, error } = await supabase
    .from('disciplinary_audit_log')
    .select(
      `
      *,
      user:an_users (id, name, email)
    `
    )
    .eq('matter_id', matterId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching disciplinary audit log:', error);
    throw new Error('Failed to fetch audit log');
  }

  return data || [];
}

// =============================================================================
// STATISTICS & ANALYTICS
// =============================================================================

/**
 * Retrieves disciplinary statistics
 */
export async function getDisciplinaryStatistics(filters?: {
  start_date?: string;
  end_date?: string;
  pilot_id?: string;
}) {
  let query = supabase
    .from('disciplinary_matters')
    .select('id, severity, status, incident_date, pilot_id');

  if (filters?.start_date) {
    query = query.gte('incident_date', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('incident_date', filters.end_date);
  }
  if (filters?.pilot_id) {
    query = query.eq('pilot_id', filters.pilot_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching disciplinary statistics:', error);
    throw new Error('Failed to fetch statistics');
  }

  const matters = data || [];

  return {
    total: matters.length,
    by_severity: {
      minor: matters.filter((m) => m.severity === 'MINOR').length,
      moderate: matters.filter((m) => m.severity === 'MODERATE').length,
      serious: matters.filter((m) => m.severity === 'SERIOUS').length,
      critical: matters.filter((m) => m.severity === 'CRITICAL').length,
    },
    by_status: {
      open: matters.filter((m) => m.status === 'OPEN').length,
      under_investigation: matters.filter((m) => m.status === 'UNDER_INVESTIGATION').length,
      resolved: matters.filter((m) => m.status === 'RESOLVED').length,
      closed: matters.filter((m) => m.status === 'CLOSED').length,
      appealed: matters.filter((m) => m.status === 'APPEALED').length,
    },
  };
}
