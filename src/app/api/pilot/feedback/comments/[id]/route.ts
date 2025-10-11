/**
 * Comment by ID API
 * DELETE /api/pilot/feedback/comments/[id] - Delete a comment (soft delete, 1 hour window)
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteComment } from '@/lib/feedback-service';
import { supabase } from '@/lib/supabase';

/**
 * DELETE - Delete a comment (soft delete)
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
    const commentId = params.id;

    // Delete comment
    const result = await deleteComment(pilotUserId, commentId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to delete comment',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/pilot/feedback/comments/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
