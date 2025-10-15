/**
 * @fileoverview Flight Requests API Routes
 * Handles CRUD operations for flight request management
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
  getFlightRequests,
  createFlightRequest,
  getFlightRequestStatistics,
  type FlightRequestFilters,
  type CreateFlightRequestData,
} from '@/lib/flight-request-service';
import { logger } from '@/lib/logger';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

const createFlightRequestSchema = z.object({
  pilot_id: z.string().uuid('Invalid pilot ID'),
  request_type: z.enum([
    'FLIGHT_ASSIGNMENT',
    'ROUTE_QUALIFICATION',
    'TYPE_RATING',
    'LINE_CHECK',
    'SIM_TRAINING',
    'STANDBY',
    'POSITION_CHANGE',
    'BASE_CHANGE',
    'OTHER',
  ]),
  flight_number: z.string().max(20).optional(),
  route: z.string().max(100).optional(),
  departure_airport: z.string().max(10).optional(),
  arrival_airport: z.string().max(10).optional(),
  departure_date: z.string().optional(),
  return_date: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  required_qualifications: z.array(z.any()).optional(),
});

/**
 * GET /api/flight-requests
 * Retrieves flight requests with optional filters
 * @auth Required - Admin and Manager roles only
 */
export const GET = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');

      // Statistics endpoint
      if (action === 'statistics') {
        const pilot_id = searchParams.get('pilot_id') || undefined;
        const date_from = searchParams.get('date_from') || undefined;
        const date_to = searchParams.get('date_to') || undefined;

        const statistics = await getFlightRequestStatistics({
          pilot_id,
          date_from,
          date_to,
        });

        return NextResponse.json({
          success: true,
          data: statistics,
        });
      }

      // List flight requests
      const filters: FlightRequestFilters = {
        status: searchParams.get('status') as any,
        priority: searchParams.get('priority') as any,
        request_type: searchParams.get('request_type') as any,
        pilot_id: searchParams.get('pilot_id') || undefined,
        created_by: searchParams.get('created_by') || undefined,
        departure_date_from: searchParams.get('departure_date_from') || undefined,
        departure_date_to: searchParams.get('departure_date_to') || undefined,
      };

      const requests = await getFlightRequests(filters);

      return NextResponse.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      logger.error('Error in GET /api/flight-requests:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch flight requests',
        },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'manager'] }
);

/**
 * POST /api/flight-requests
 * Creates a new flight request
 * @auth Required - Admin and Manager roles only
 */
export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();

      // Validate request body
      const validation = validateRequest(createFlightRequestSchema, body);
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

      // Create flight request with authenticated user context
      const flightRequest = await createFlightRequest(
        validation.data as CreateFlightRequestData,
        user.id
      );

      return NextResponse.json(
        {
          success: true,
          data: flightRequest,
        },
        { status: 201 }
      );
    } catch (error: any) {
      logger.error('Error in POST /api/flight-requests:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to create flight request',
        },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'manager'] }
);
