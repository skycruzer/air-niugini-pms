/**
 * Admin Feedback Moderation Service
 * Admin-only functions for moderating feedback posts and comments
 */

import { getSupabaseAdmin } from './supabase';
import type { Database } from '@/types/supabase';

type FeedbackPost = Database['public']['Tables']['feedback_posts']['Row'];

export interface AdminFeedbackPostWithDetails extends FeedbackPost {
  category_name?: string;
  category_slug?: string;
  category_icon?: string;
  real_author_name?: string; // For anonymous posts
  real_author_rank?: string;
  real_author_employee_id?: string;
}

/**
 * Get all feedback posts with admin visibility (shows real identity of anonymous posts)
 */
export async function getAllFeedbackPostsAdmin(
  categoryId?: string,
  limit: number = 100
): Promise<AdminFeedbackPostWithDetails[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('feedback_posts')
      .select(
        `
        *,
        feedback_categories!inner (
          name,
          slug,
          icon
        ),
        pilot_users!inner (
          first_name,
          last_name,
          rank,
          employee_id
        )
      `
      )
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin posts:', error);
      throw error;
    }

    return (data || []).map((post) => ({
      ...post,
      category_name: post.feedback_categories?.name,
      category_slug: post.feedback_categories?.slug,
      category_icon: post.feedback_categories?.icon,
      real_author_name:
        post.pilot_users?.first_name && post.pilot_users?.last_name
          ? `${post.pilot_users.first_name} ${post.pilot_users.last_name}`
          : 'Unknown',
      real_author_rank: post.pilot_users?.rank,
      real_author_employee_id: post.pilot_users?.employee_id,
    }));
  } catch (error) {
    console.error('Error in getAllFeedbackPostsAdmin:', error);
    throw error;
  }
}

/**
 * Pin or unpin a feedback post
 */
export async function togglePinPost(
  postId: string,
  isPinned: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from('feedback_posts')
      .update({ is_pinned: isPinned })
      .eq('id', postId);

    if (error) {
      console.error('Error toggling pin:', error);
      return {
        success: false,
        error: 'Failed to update post',
      };
    }

    console.log(`✅ Post ${isPinned ? 'pinned' : 'unpinned'}:`, postId);

    return { success: true };
  } catch (error) {
    console.error('Error in togglePinPost:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Update post status (active, archived, removed)
 */
export async function updatePostStatus(
  postId: string,
  status: 'active' | 'archived' | 'removed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from('feedback_posts')
      .update({ status })
      .eq('id', postId);

    if (error) {
      console.error('Error updating post status:', error);
      return {
        success: false,
        error: 'Failed to update post status',
      };
    }

    console.log(`✅ Post status updated to ${status}:`, postId);

    return { success: true };
  } catch (error) {
    console.error('Error in updatePostStatus:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<{
  total_posts: number;
  active_posts: number;
  pinned_posts: number;
  anonymous_posts: number;
  archived_posts: number;
  total_comments: number;
}> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: posts, error: postsError } = await supabaseAdmin
      .from('feedback_posts')
      .select('id, status, is_pinned, is_anonymous');

    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('feedback_comments')
      .select('id')
      .is('deleted_at', null);

    if (postsError || commentsError) {
      throw postsError || commentsError;
    }

    return {
      total_posts: posts?.length || 0,
      active_posts: posts?.filter((p) => p.status === 'active').length || 0,
      pinned_posts: posts?.filter((p) => p.is_pinned).length || 0,
      anonymous_posts: posts?.filter((p) => p.is_anonymous).length || 0,
      archived_posts: posts?.filter((p) => p.status === 'archived').length || 0,
      total_comments: comments?.length || 0,
    };
  } catch (error) {
    console.error('Error in getModerationStats:', error);
    return {
      total_posts: 0,
      active_posts: 0,
      pinned_posts: 0,
      anonymous_posts: 0,
      archived_posts: 0,
      total_comments: 0,
    };
  }
}
