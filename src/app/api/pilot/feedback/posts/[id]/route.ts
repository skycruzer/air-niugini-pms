/**
 * Feedback Post by ID API
 * GET /api/pilot/feedback/posts/[id] - Get single feedback post and increment view count
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeedbackPostById, incrementPostViewCount } from '@/lib/feedback-service';

/**
 * GET - Get feedback post by ID and increment view count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Get post details
    const post = await getFeedbackPostById(postId);

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post not found',
        },
        { status: 404 }
      );
    }

    // Increment view count (async, don't wait)
    incrementPostViewCount(postId).catch((error) =>
      console.error('Error incrementing view count:', error)
    );

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('GET /api/pilot/feedback/posts/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch post',
      },
      { status: 500 }
    );
  }
}
