/**
 * Admin Feedback Posts API
 * GET /api/admin/feedback/posts - Get all posts with admin visibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllFeedbackPostsAdmin, getModerationStats } from '@/lib/feedback-admin-service';
import { supabase } from '@/lib/supabase';

/**
 * GET - Get all feedback posts with admin visibility
 */
export async function GET(request: NextRequest) {
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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('category_id') || undefined;
    const includeStats = searchParams.get('include_stats') === 'true';

    // Fetch posts
    const posts = await getAllFeedbackPostsAdmin(categoryId);

    // Optionally include stats
    let stats = null;
    if (includeStats) {
      stats = await getModerationStats();
    }

    return NextResponse.json({
      success: true,
      data: posts,
      stats,
    });
  } catch (error) {
    console.error('GET /api/admin/feedback/posts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch posts',
      },
      { status: 500 }
    );
  }
}
