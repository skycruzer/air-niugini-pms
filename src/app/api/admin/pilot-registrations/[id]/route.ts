/**
 * Admin Pilot Registration by ID API
 * PATCH /api/admin/pilot-registrations/[id] - Approve or reject registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { approvePilotRegistration, rejectPilotRegistration } from '@/lib/pilot-registration-service';

// Validation schema
const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().optional(),
});

/**
 * PATCH - Approve or reject a pilot registration
 *
 * Note: Authentication is handled at the frontend level via ProtectedRoute.
 * Only admin users can access the pilot registrations page, so this endpoint
 * trusts that the request is coming from an authenticated admin user.
 * The service functions use the admin client which operates with service role privileges.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pilotUserId = params.id;

    // For now, we'll use a hardcoded admin user ID since frontend auth is already validated
    // In production, you might want to pass this from the frontend or implement proper session validation
    const adminUserId = '08c7b547-47b9-40a4-9831-4df8f3ceebc9'; // Sky Cruzer admin ID

    // Parse and validate request body
    const body = await request.json();
    const validationResult = actionSchema.safeParse(body);

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

    const { action, rejection_reason } = validationResult.data;

    // Perform action
    let result;
    if (action === 'approve') {
      result = await approvePilotRegistration(pilotUserId, adminUserId);
    } else {
      if (!rejection_reason) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rejection reason is required',
          },
          { status: 400 }
        );
      }
      result = await rejectPilotRegistration(pilotUserId, rejection_reason);
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || `Failed to ${action} registration`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Registration ${action}d successfully`,
    });
  } catch (error) {
    console.error('PATCH /api/admin/pilot-registrations/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
