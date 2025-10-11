/**
 * Feedback Posts API
 * GET /api/pilot/feedback/posts - Get feedback posts (optionally filtered by category)
 * POST /api/pilot/feedback/posts - Create new feedback post
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFeedbackPosts, createFeedbackPost } from '@/lib/feedback-service';
import { supabase } from '@/lib/supabase';

// Validation schema for post creation
const postSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  content: z.string().min(20, 'Content must be at least 20 characters').max(5000),
  is_anonymous: z.boolean().default(false),
  tags: z.array(z.string()).max(5).optional(),
});

/**
 * GET - Get feedback posts
 * Query params: category_id (optional), limit (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('category_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const posts = await getFeedbackPosts(categoryId, limit);

    return NextResponse.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error('GET /api/pilot/feedback/posts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch posts',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new feedback post
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
    const validationResult = postSchema.safeParse(body);

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

    const postData = validationResult.data;

    // Create feedback post
    const result = await createFeedbackPost(pilotUserId, postData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create post',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Post created successfully',
        postId: result.postId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/pilot/feedback/posts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
