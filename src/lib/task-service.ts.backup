/**
 * @fileoverview Task management service layer
 * Handles all business logic for to-do list and task tracking
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { getSupabaseAdmin } from './supabase';
import { addDays, addWeeks, addMonths, parseISO } from 'date-fns';

// Get admin client instance for server-side operations
const supabase = getSupabaseAdmin();

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  created_by: string;
  assigned_to?: string;
  related_pilot_id?: string;
  related_matter_id?: string;
  due_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  parent_task_id?: string;
  tags: string[];
  attachments: any[];
  checklist_items: ChecklistItem[];
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface RecurrencePattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  end_date?: string;
  count?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  mentions: string[];
  attachments: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category_id?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigned_to?: string;
  related_pilot_id?: string;
  related_matter_id?: string;
  due_date?: string;
  estimated_hours?: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  parent_task_id?: string;
  tags?: string[];
  checklist_items?: ChecklistItem[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category_id?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  assigned_to?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  checklist_items?: ChecklistItem[];
  progress_percentage?: number;
}

// =============================================================================
// TASK CATEGORIES
// =============================================================================

/**
 * Retrieves all task categories
 */
export async function getTaskCategories(): Promise<TaskCategory[]> {
  const { data, error } = await supabase
    .from('task_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching task categories:', error);
    throw new Error('Failed to fetch task categories');
  }

  return data || [];
}

/**
 * Creates a new task category (admin only)
 */
export async function createTaskCategory(category: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  display_order?: number;
}) {
  const { data, error } = await supabase.from('task_categories').insert(category).select().single();

  if (error) {
    console.error('Error creating task category:', error);
    throw new Error('Failed to create task category');
  }

  return data;
}

// =============================================================================
// TASKS - CRUD OPERATIONS
// =============================================================================

/**
 * SECURITY NOTE: Service functions use admin client to bypass RLS for performance.
 * Authentication and authorization MUST be enforced at the API route level using withAuth middleware.
 * These functions should NEVER be called from unauthenticated contexts.
 */

/**
 * Retrieves all tasks with filters
 * @security Called from authenticated API routes only. No user context needed for READ operations.
 */
export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_by?: string;
  category_id?: string;
  related_pilot_id?: string;
  include_completed?: boolean;
}) {
  let query = supabase
    .from('tasks')
    .select(
      `
      *,
      category:task_categories (id, name, color, icon),
      creator:an_users!tasks_created_by_fkey (id, name, email),
      assignee:an_users!tasks_assigned_to_fkey (id, name, email),
      pilot:pilots (id, first_name, last_name, employee_id),
      matter:disciplinary_matters (id, title, status)
    `
    )
    .order('created_at', { ascending: false });

  if (!filters?.include_completed) {
    query = query.not('status', 'in', '(COMPLETED,CANCELLED)');
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.related_pilot_id) {
    query = query.eq('related_pilot_id', filters.related_pilot_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }

  return data || [];
}

/**
 * Retrieves a single task by ID
 */
export async function getTaskById(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      category:task_categories (id, name, color, icon),
      creator:an_users!tasks_created_by_fkey (id, name, email),
      assignee:an_users!tasks_assigned_to_fkey (id, name, email),
      pilot:pilots (id, first_name, last_name, employee_id, role),
      matter:disciplinary_matters (id, title, status, severity),
      parent:tasks!tasks_parent_task_id_fkey (id, title, status),
      subtasks:tasks!tasks_parent_task_id_fkey (id, title, status, progress_percentage)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching task:', error);
    throw new Error('Failed to fetch task');
  }

  return data;
}

/**
 * Creates a new task
 * @param input Task data to create
 * @param createdBy User ID of the authenticated user creating the task (REQUIRED)
 * @security Must be called from authenticated API route with user context
 */
export async function createTask(input: CreateTaskInput, createdBy: string) {
  // Security assertion: Ensure user context is provided
  if (!createdBy) {
    throw new Error('Authorization required: createdBy user ID must be provided');
  }
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...input,
      created_by: createdBy,
      status: 'TODO',
      priority: input.priority || 'MEDIUM',
      is_recurring: input.is_recurring || false,
      tags: input.tags || [],
      attachments: [],
      checklist_items: input.checklist_items || [],
      progress_percentage: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }

  // Log audit trail
  await logTaskAudit(data.id, createdBy, 'CREATE', null, null, null);

  // Handle recurring tasks
  if (input.is_recurring && input.recurrence_pattern) {
    await createRecurringTaskInstances(data.id, input.recurrence_pattern, createdBy);
  }

  return data;
}

/**
 * Updates an existing task
 * @param id Task ID to update
 * @param input Update data
 * @param userId User ID of the authenticated user making the update (REQUIRED)
 * @security Must be called from authenticated API route with user context
 */
export async function updateTask(id: string, input: UpdateTaskInput, userId: string) {
  // Security assertion: Ensure user context is provided
  if (!userId) {
    throw new Error('Authorization required: userId must be provided');
  }

  // Get current state for audit log
  const current = await getTaskById(id);

  const updateData: any = { ...input };

  // Auto-set completed_date if status changed to COMPLETED
  if (input.status === 'COMPLETED' && current.status !== 'COMPLETED') {
    updateData.completed_date = new Date().toISOString();
  }

  // Auto-calculate progress from checklist if not provided
  if (!input.progress_percentage && input.checklist_items) {
    const completed = input.checklist_items.filter((item) => item.completed).length;
    const total = input.checklist_items.length;
    updateData.progress_percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }

  // Log audit trail for changed fields
  for (const [key, value] of Object.entries(input)) {
    if (JSON.stringify(current[key]) !== JSON.stringify(value)) {
      await logTaskAudit(
        id,
        userId,
        'UPDATE',
        key,
        JSON.stringify(current[key] || ''),
        JSON.stringify(value || '')
      );
    }
  }

  return data;
}

/**
 * Deletes a task
 * @param id Task ID to delete
 * @param userId User ID of the authenticated user performing the deletion (REQUIRED)
 * @security Must be called from authenticated API route. Only admins should be able to delete tasks.
 */
export async function deleteTask(id: string, userId: string) {
  // Security assertion: Ensure user context is provided
  if (!userId) {
    throw new Error('Authorization required: userId must be provided');
  }
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }

  await logTaskAudit(id, userId, 'DELETE', null, null, null);
}

// =============================================================================
// TASK COMMENTS
// =============================================================================

/**
 * Retrieves all comments for a task
 */
export async function getTaskComments(taskId: string) {
  const { data, error } = await supabase
    .from('task_comments')
    .select(
      `
      *,
      user:an_users (id, name, email)
    `
    )
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching task comments:', error);
    throw new Error('Failed to fetch task comments');
  }

  return data || [];
}

/**
 * Creates a new comment on a task
 * @param taskId Task ID to comment on
 * @param comment Comment text
 * @param userId User ID of the authenticated user creating the comment (REQUIRED)
 * @param mentions Array of user IDs mentioned in the comment
 * @param attachments Array of attachment objects
 * @security Must be called from authenticated API route with user context
 */
export async function createTaskComment(
  taskId: string,
  comment: string,
  userId: string,
  mentions: string[] = [],
  attachments: any[] = []
) {
  // Security assertion: Ensure user context is provided
  if (!userId) {
    throw new Error('Authorization required: userId must be provided');
  }
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      comment,
      mentions,
      attachments,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task comment:', error);
    throw new Error('Failed to create comment');
  }

  return data;
}

// =============================================================================
// RECURRING TASKS
// =============================================================================

/**
 * Creates recurring task instances based on pattern
 */
async function createRecurringTaskInstances(
  parentTaskId: string,
  pattern: RecurrencePattern,
  createdBy: string
) {
  const parentTask = await getTaskById(parentTaskId);
  if (!parentTask.due_date) return;

  const instances: any[] = [];
  let currentDate = parseISO(parentTask.due_date);
  const endDate = pattern.end_date ? parseISO(pattern.end_date) : null;
  const maxCount = pattern.count || 10;

  for (let i = 0; i < maxCount; i++) {
    // Calculate next occurrence
    switch (pattern.frequency) {
      case 'DAILY':
        currentDate = addDays(currentDate, pattern.interval);
        break;
      case 'WEEKLY':
        currentDate = addWeeks(currentDate, pattern.interval);
        break;
      case 'MONTHLY':
        currentDate = addMonths(currentDate, pattern.interval);
        break;
      case 'YEARLY':
        currentDate = addMonths(currentDate, pattern.interval * 12);
        break;
    }

    // Check if we've reached the end date
    if (endDate && currentDate > endDate) break;

    instances.push({
      title: parentTask.title,
      description: parentTask.description,
      category_id: parentTask.category_id,
      priority: parentTask.priority,
      created_by: createdBy,
      assigned_to: parentTask.assigned_to,
      related_pilot_id: parentTask.related_pilot_id,
      related_matter_id: parentTask.related_matter_id,
      due_date: currentDate.toISOString(),
      estimated_hours: parentTask.estimated_hours,
      parent_task_id: parentTaskId,
      is_recurring: false,
      tags: parentTask.tags,
      checklist_items: parentTask.checklist_items,
    });
  }

  if (instances.length > 0) {
    const { error } = await supabase.from('tasks').insert(instances);

    if (error) {
      console.error('Error creating recurring task instances:', error);
    }
  }
}

// =============================================================================
// AUDIT LOG
// =============================================================================

/**
 * Logs an audit trail entry for task changes
 */
async function logTaskAudit(
  taskId: string,
  userId: string,
  action: string,
  fieldChanged: string | null,
  oldValue: string | null,
  newValue: string | null
) {
  const { error } = await supabase.from('task_audit_log').insert({
    task_id: taskId,
    user_id: userId,
    action,
    field_changed: fieldChanged,
    old_value: oldValue,
    new_value: newValue,
  });

  if (error) {
    console.error('Error logging task audit:', error);
  }
}

/**
 * Retrieves audit log for a task
 */
export async function getTaskAuditLog(taskId: string) {
  const { data, error } = await supabase
    .from('task_audit_log')
    .select(
      `
      *,
      user:an_users (id, name, email)
    `
    )
    .eq('task_id', taskId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching task audit log:', error);
    throw new Error('Failed to fetch audit log');
  }

  return data || [];
}

// =============================================================================
// STATISTICS & ANALYTICS
// =============================================================================

/**
 * Retrieves task statistics
 */
export async function getTaskStatistics(filters?: {
  assigned_to?: string;
  created_by?: string;
  start_date?: string;
  end_date?: string;
}) {
  let query = supabase
    .from('tasks')
    .select('id, status, priority, due_date, assigned_to, created_by');

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }
  if (filters?.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching task statistics:', error);
    throw new Error('Failed to fetch statistics');
  }

  const tasks = data || [];
  const now = new Date();

  return {
    total: tasks.length,
    by_status: {
      todo: tasks.filter((t) => t.status === 'TODO').length,
      in_progress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      blocked: tasks.filter((t) => t.status === 'BLOCKED').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      cancelled: tasks.filter((t) => t.status === 'CANCELLED').length,
    },
    by_priority: {
      low: tasks.filter((t) => t.priority === 'LOW').length,
      medium: tasks.filter((t) => t.priority === 'MEDIUM').length,
      high: tasks.filter((t) => t.priority === 'HIGH').length,
      urgent: tasks.filter((t) => t.priority === 'URGENT').length,
    },
    overdue: tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < now &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELLED'
    ).length,
  };
}
