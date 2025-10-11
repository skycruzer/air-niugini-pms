/**
 * Pilot Leave Requests API
 * GET /api/pilot/leave - Get all leave requests for authenticated pilot
 * POST /api/pilot/leave - Submit new leave request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  submitPilotLeaveRequest,
  getPilotLeaveRequests,
  type PilotLeaveRequestData,
} from '@/lib/pilot-leave-service';
import { supabase } from '@/lib/supabase';

// Validation schema
const leaveRequestSchema = z.object({
  request_type: z.enum(['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
  reason: z.string().max(500).optional(),
});

/**
 * GET - Get all leave requests for authenticated pilot
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated pilot user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const pilotUserId = session.user.id;

    // Get leave requests
    const requests = await getPilotLeaveRequests(pilotUserId);

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('GET /api/pilot/leave error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leave requests',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Submit new leave request
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated pilot user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const pilotUserId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = leaveRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const requestData: PilotLeaveRequestData = validationResult.data;

    // Submit leave request
    const result = await submitPilotLeaveRequest(pilotUserId, requestData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to submit leave request',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Leave request submitted successfully',
        requestId: result.requestId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/pilot/leave error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
