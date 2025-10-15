/**
 * @fileoverview Flight Request Detail API Routes
 * Handles individual flight request operations (GET, PATCH, DELETE)
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/validation-schemas';
import { z } from 'zod';
import { withAuth } from '@/middleware/auth';
import {
  getFlightRequestById,
  updateFlightRequest,
  deleteFlightRequest,
  approveFlightRequest,
  rejectFlightRequest,
  cancelFlightRequest,
  type UpdateFlightRequestData,
} from '@/lib/flight-request-service';
import { logger } from '@/lib/logger';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

const updateFlightRequestSchema = z.object({
  request_type: z
    .enum([
      'FLIGHT_ASSIGNMENT',
      'ROUTE_QUALIFICATION',
      'TYPE_RATING',
      'LINE_CHECK',
      'SIM_TRAINING',
      'STANDBY',
      'POSITION_CHANGE',
      'BASE_CHANGE',
      'OTHER',
    ])
    .optional(),
  flight_number: z.string().max(20).optional(),
  route: z.string().max(100).optional(),
  departure_airport: z.string().max(10).optional(),
  arrival_airport: z.string().max(10).optional(),
  departure_date: z.string().optional(),
  return_date: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  status: z
    .enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
    .optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  required_qualifications: z.array(z.any()).optional(),
  // For status-specific actions
  action: z.enum(['approve', 'reject', 'cancel']).optional(),
  review_notes: z.string().optional(),
  cancellation_reason: z.string().optional(),
});

/**
 * GET /api/flight-requests/[id]
 * Get a single flight request by ID
 * @auth Required - Admin, Manager, or request creator
 */
export const GET = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = params;

      const flightRequest = await getFlightRequestById(id);

      if (!flightRequest) {
        return NextResponse.json(
          {
            success: false,
            error: 'Flight request not found',
          },
          { status: 404 }
        );
      }

      // Check access permission (admin/manager or request creator/pilot)
      const hasAccess =
        user.role === 'admin' ||
        user.role === 'manager' ||
        flightRequest.created_by === user.id ||
        flightRequest.pilot_id === user.id;

      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied',
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { flightRequest },
      });
    } catch (error) {
      logger.error('Error in GET /api/flight-requests/[id]:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch flight request',
        },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'manager'] }
);

/**
 * PATCH /api/flight-requests/[id]
 * Update a flight request or perform status actions
 * @auth Required - Admin, Manager roles
 */
export const PATCH = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = params;
      const body = await request.json();

      // Validate request body
      const validation = validateRequest(updateFlightRequestSchema, body);
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

      const { action, review_notes, cancellation_reason, ...updateData } = validation.data;

      let updatedRequest;

      // Handle status-specific actions
      if (action === 'approve') {
        updatedRequest = await approveFlightRequest(id, user.id, review_notes);
      } else if (action === 'reject') {
        if (!review_notes) {
          return NextResponse.json(
            {
              success: false,
              error: 'Review notes are required when rejecting a request',
            },
            { status: 400 }
          );
        }
        updatedRequest = await rejectFlightRequest(id, user.id, review_notes);
      } else if (action === 'cancel') {
        if (!cancellation_reason) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cancellation reason is required',
            },
            { status: 400 }
          );
        }
        updatedRequest = await cancelFlightRequest(id, user.id, cancellation_reason);
      } else {
        // Regular update
        updatedRequest = await updateFlightRequest(
          id,
          updateData as UpdateFlightRequestData,
          user.id
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedRequest,
      });
    } catch (error: any) {
      logger.error('Error in PATCH /api/flight-requests/[id]:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to update flight request',
        },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'manager'] }
);

/**
 * DELETE /api/flight-requests/[id]
 * Delete a flight request (admin only)
 * @auth Required - Admin role only
 */
export const DELETE = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = params;

      await deleteFlightRequest(id);

      return NextResponse.json({
        success: true,
        message: 'Flight request deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error in DELETE /api/flight-requests/[id]:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to delete flight request',
        },
        { status: 500 }
      );
    }
  },
  { roles: ['admin'] }
);
