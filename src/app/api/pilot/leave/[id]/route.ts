/**
 * Pilot Leave Request by ID API
 * DELETE /api/pilot/leave/[id] - Cancel pending leave request
 */

import { NextRequest, NextResponse } from 'next/server';
import { cancelPilotLeaveRequest } from '@/lib/pilot-leave-service';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * DELETE - Cancel a pending leave request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create server-side Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Get authenticated pilot user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Auth session missing!',
        },
        { status: 401 }
      );
    }

    const pilotUserId = user.id;
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
