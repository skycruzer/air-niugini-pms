/**
 * Post Comments API
 * GET /api/pilot/feedback/posts/[id]/comments - Get all comments for a post
 * POST /api/pilot/feedback/posts/[id]/comments - Create new comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPostComments, createComment } from '@/lib/feedback-service';
import { supabase } from '@/lib/supabase';

// Validation schema for comment creation
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
  parent_comment_id: z.string().uuid().optional(),
});

/**
 * GET - Get all comments for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const comments = await getPostComments(postId);

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('GET /api/pilot/feedback/posts/[id]/comments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch comments',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new comment
 */
export async function POST(
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
    const postId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = commentSchema.safeParse(body);

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

    const { content, parent_comment_id } = validationResult.data;

    // Create comment
    const result = await createComment(pilotUserId, postId, content, parent_comment_id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create comment',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Comment created successfully',
        commentId: result.commentId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/pilot/feedback/posts/[id]/comments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
