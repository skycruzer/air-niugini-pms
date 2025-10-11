/**
 * Admin Pilot Registration by ID API
 * PATCH /api/admin/pilot-registrations/[id] - Approve or reject registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { approvePilotRegistration, rejectPilotRegistration } from '@/lib/pilot-registration-service';
import { supabase } from '@/lib/supabase';

// Validation schema
const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().optional(),
});

/**
 * PATCH - Approve or reject a pilot registration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated admin user
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

    // Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('an_users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin access required',
        },
        { status: 403 }
      );
    }

    const pilotUserId = params.id;

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
      result = await approvePilotRegistration(pilotUserId);
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
