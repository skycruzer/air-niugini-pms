/**
 * Admin Feedback Post Moderation API
 * PATCH /api/admin/feedback/posts/[id] - Moderate post (pin, archive, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { togglePinPost, updatePostStatus } from '@/lib/feedback-admin-service';
import { supabase } from '@/lib/supabase';

// Validation schema
const moderationSchema = z.object({
  action: z.enum(['pin', 'unpin', 'archive', 'activate', 'remove']),
});

/**
 * PATCH - Moderate a feedback post
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

    if (adminError || !adminUser || !['admin', 'manager'].includes(adminUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin/Manager access required',
        },
        { status: 403 }
      );
    }

    const postId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = moderationSchema.safeParse(body);

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

    const { action } = validationResult.data;

    // Perform moderation action
    let result;
    switch (action) {
      case 'pin':
        result = await togglePinPost(postId, true);
        break;
      case 'unpin':
        result = await togglePinPost(postId, false);
        break;
      case 'archive':
        result = await updatePostStatus(postId, 'archived');
        break;
      case 'activate':
        result = await updatePostStatus(postId, 'active');
        break;
      case 'remove':
        result = await updatePostStatus(postId, 'removed');
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || `Failed to ${action} post`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Post ${action}d successfully`,
    });
  } catch (error) {
    console.error('PATCH /api/admin/feedback/posts/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
