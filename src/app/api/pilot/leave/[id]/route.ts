/**
 * Pilot Leave Request by ID API
 * DELETE /api/pilot/leave/[id] - Cancel pending leave request
 */

import { NextRequest, NextResponse } from 'next/server';
import { cancelPilotLeaveRequest } from '@/lib/pilot-leave-service';
import { supabase } from '@/lib/supabase';

/**
 * DELETE - Cancel a pending leave request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const requestId = params.id;

    // Cancel leave request
    const result = await cancelPilotLeaveRequest(pilotUserId, requestId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to cancel leave request',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Leave request canceled successfully',
    });
  } catch (error) {
    console.error('DELETE /api/pilot/leave/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
