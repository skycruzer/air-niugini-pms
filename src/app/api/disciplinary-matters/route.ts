/**
 * @fileoverview Disciplinary matters API routes
 * Handles CRUD operations for disciplinary matter tracking
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/validation-schemas';
import { z } from 'zod';
import { withAuth, permissions } from '@/middleware/auth';
import {
  getDisciplinaryMatters,
  createDisciplinaryMatter,
  getDisciplinaryStatistics,
} from '@/lib/disciplinary-service';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Strict validation schemas for disciplinary matters
const witnessSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(100).optional(),
  contact: z.string().max(100).optional(),
  statement: z.string().optional(),
});

const evidenceFileSchema = z.object({
  filename: z.string().min(1).max(255),
  url: z.string().url(),
  fileType: z.string().max(50),
  uploadedAt: z.string().datetime().optional(),
  uploadedBy: z.string().uuid().optional(),
  description: z.string().optional(),
});

// Validation schema for creating disciplinary matters
const createDisciplinaryMatterSchema = z.object({
  pilot_id: z.string().uuid(),
  incident_type_id: z.string().uuid(),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  severity: z.enum(['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  location: z.string().max(200).optional(),
  flight_number: z.string().max(20).optional(),
  aircraft_registration: z.string().max(20).optional(),
  witnesses: z.array(witnessSchema).optional(),
  evidence_files: z.array(evidenceFileSchema).optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  regulatory_notification_required: z.boolean().optional(),
  regulatory_body: z.string().max(100).optional(),
});

/**
 * GET /api/disciplinary-matters
 * Retrieves disciplinary matters with optional filters
 * @auth Required - Admin and Manager roles only
 */
export const GET = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');

      // Statistics endpoint
      if (action === 'statistics') {
        const start_date = searchParams.get('start_date') || undefined;
        const end_date = searchParams.get('end_date') || undefined;
        const pilot_id = searchParams.get('pilot_id') || undefined;

        const statistics = await getDisciplinaryStatistics({
          start_date,
          end_date,
          pilot_id,
        });

        return NextResponse.json({
          success: true,
          data: statistics,
        });
      }

      // List disciplinary matters
      const filters = {
        pilot_id: searchParams.get('pilot_id') || undefined,
        status: searchParams.get('status') || undefined,
        severity: searchParams.get('severity') || undefined,
        assigned_to: searchParams.get('assigned_to') || undefined,
      };

      const matters = await getDisciplinaryMatters(filters);

      return NextResponse.json({
        success: true,
        data: matters,
      });
    } catch (error) {
      console.error('Error in GET /api/disciplinary-matters:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch disciplinary matters',
        },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'manager'] }
);

/**
 * POST /api/disciplinary-matters
 * Creates a new disciplinary matter
 * @auth Required - Admin and Manager roles only
 */
export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();

      // Validate request body
      const validation = validateRequest(createDisciplinaryMatterSchema, body);
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

      // Create disciplinary matter with authenticated user context for audit trail
      const matter = await createDisciplinaryMatter(validation.data, user.id);

      return NextResponse.json(
        {
          success: true,
          data: matter,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in POST /api/disciplinary-matters:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create disciplinary matter',
        },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'manager'] }
);
