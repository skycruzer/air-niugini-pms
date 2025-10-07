/**
 * @fileoverview Task detail API routes
 * Handles operations on individual tasks
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { validateRequest, isValidUUID } from '@/lib/validation-schemas';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  getTaskById,
  updateTask,
  deleteTask,
  getTaskComments,
  getTaskAuditLog,
} from '@/lib/task-service';

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T/)
    .optional(),
  estimated_hours: z.number().min(0).optional(),
  actual_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  checklist_items: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        completed: z.boolean(),
        completed_at: z.string().optional(),
        completed_by: z.string().optional(),
      })
    )
    .optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
});

/**
 * GET /api/tasks/[id]
 * Retrieves a single task with related data
 */
export const GET = withAuth(async (request: NextRequest, { user, params }: any) => {
  try {
    const { id } = params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include');

    const task = await getTaskById(id);

    // Check access (user must be creator, assignee, or admin)
    if (task.created_by !== user.id && task.assigned_to !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const response: any = { task };

    // Include related data based on query params
    if (include?.includes('comments')) {
      response.comments = await getTaskComments(id);
    }
    if (include?.includes('audit')) {
      response.audit_log = await getTaskAuditLog(id);
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error in GET /api/tasks/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch task' }, { status: 500 });
  }
});

/**
 * PATCH /api/tasks/[id]
 * Updates a task
 */
export const PATCH = withAuth(async (request: NextRequest, { user, params }: any) => {
  try {
    const { id } = params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const body = await request.json();

    const validation = validateRequest(updateTaskSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          details: validation.details,
        },
        { status: 400 }
      );
    }

    const task = await updateTask(id, validation.data, user.id);

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error('Error in PATCH /api/tasks/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
});

/**
 * DELETE /api/tasks/[id]
 * Deletes a task
 */
export const DELETE = withAuth(async (request: NextRequest, { user, params }: any) => {
  try {
    const { id } = params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    // Get task to check ownership
    const task = await getTaskById(id);

    if (task.created_by !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only the task creator or admin can delete tasks' },
        { status: 403 }
      );
    }

    await deleteTask(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    logger.error('Error in DELETE /api/tasks/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
});
