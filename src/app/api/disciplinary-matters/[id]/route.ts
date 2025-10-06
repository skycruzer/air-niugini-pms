/**
 * @fileoverview Disciplinary matter detail API routes
 * Handles operations on individual disciplinary matters
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { validateRequest, isValidUUID } from '@/lib/validation-schemas';
import { z } from 'zod';
import {
  getDisciplinaryMatterById,
  updateDisciplinaryMatter,
  deleteDisciplinaryMatter,
  getDisciplinaryActions,
  getDisciplinaryComments,
  getDisciplinaryAuditLog,
} from '@/lib/disciplinary-service';

const updateDisciplinaryMatterSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', 'APPEALED']).optional(),
  corrective_actions: z.string().optional(),
  resolution_notes: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  resolved_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  impact_on_operations: z.string().optional(),
  regulatory_body: z.string().max(100).optional(),
  notification_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/**
 * GET /api/disciplinary-matters/[id]
 * Retrieves a single disciplinary matter with related data
 */
export const GET = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = params;

      if (!isValidUUID(id)) {
        return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
      }

      const { searchParams } = new URL(request.url);
      const include = searchParams.get('include');

      const matter = await getDisciplinaryMatterById(id);

      const response: any = { matter };

      // Include related data based on query params
      if (include?.includes('actions')) {
        response.actions = await getDisciplinaryActions(id);
      }
      if (include?.includes('comments')) {
        response.comments = await getDisciplinaryComments(id);
      }
      if (include?.includes('audit')) {
        response.audit_log = await getDisciplinaryAuditLog(id);
      }

      return NextResponse.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Error in GET /api/disciplinary-matters/[id]:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch disciplinary matter' },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'manager'] }
);

/**
 * PATCH /api/disciplinary-matters/[id]
 * Updates a disciplinary matter
 */
export const PATCH = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = params;

      if (!isValidUUID(id)) {
        return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
      }

      const body = await request.json();

      const validation = validateRequest(updateDisciplinaryMatterSchema, body);
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

      const matter = await updateDisciplinaryMatter(id, validation.data, user.id);

      return NextResponse.json({
        success: true,
        data: matter,
      });
    } catch (error) {
      console.error('Error in PATCH /api/disciplinary-matters/[id]:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update disciplinary matter' },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'manager'] }
);

/**
 * DELETE /api/disciplinary-matters/[id]
 * Deletes a disciplinary matter (admin only)
 */
export const DELETE = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = params;

      if (!isValidUUID(id)) {
        return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
      }

      await deleteDisciplinaryMatter(id, user.id);

      return NextResponse.json({
        success: true,
        message: 'Disciplinary matter deleted successfully',
      });
    } catch (error) {
      console.error('Error in DELETE /api/disciplinary-matters/[id]:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete disciplinary matter' },
        { status: 500 }
      );
    }
  },
  { roles: ['admin'] }
);
