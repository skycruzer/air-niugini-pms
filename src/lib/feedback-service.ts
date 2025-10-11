/**
 * Feedback Platform Service
 * Handles feedback categories, posts, comments, and notifications
 */

import { getSupabaseAdmin, supabase } from './supabase';
import type { Database } from '@/types/supabase';

type FeedbackCategory = Database['public']['Tables']['feedback_categories']['Row'];
type FeedbackCategoryInsert = Database['public']['Tables']['feedback_categories']['Insert'];
type FeedbackPost = Database['public']['Tables']['feedback_posts']['Row'];
type FeedbackPostInsert = Database['public']['Tables']['feedback_posts']['Insert'];
type FeedbackComment = Database['public']['Tables']['feedback_comments']['Row'];
type FeedbackCommentInsert = Database['public']['Tables']['feedback_comments']['Insert'];

export interface FeedbackPostWithDetails extends FeedbackPost {
  category_name?: string;
  category_slug?: string;
  category_icon?: string;
}

export interface FeedbackCommentWithAuthor extends FeedbackComment {
  author_name?: string;
  author_rank?: string;
}

/**
 * Get all feedback categories
 */
export async function getAllCategories(): Promise<FeedbackCategory[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('feedback_categories')
      .select('*')
      .eq('is_archived', false)
      .order('post_count', { ascending: false });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    throw error;
  }
}

/**
 * Create a new category (pilot-created)
 */
export async function createCategory(
  pilotUserId: string,
  name: string,
  description?: string,
  icon?: string
): Promise<{ success: boolean; error?: string; categoryId?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('feedback_categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: 'A category with this name already exists',
      };
    }

    // Create category
    const categoryData: FeedbackCategoryInsert = {
      name,
      description,
      icon: icon || '💬',
      slug,
      created_by: pilotUserId,
      created_by_type: 'pilot',
      is_default: false,
    };

    const { data: newCategory, error: insertError } = await supabaseAdmin
      .from('feedback_categories')
      .insert(categoryData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating category:', insertError);
      return {
        success: false,
        error: 'Failed to create category',
      };
    }

    console.log('✅ Category created:', newCategory.id);

    return {
      success: true,
      categoryId: newCategory.id,
    };
  } catch (error) {
    console.error('Error in createCategory:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get feedback posts (optionally filtered by category)
 */
export async function getFeedbackPosts(
  categoryId?: string,
  limit: number = 50
): Promise<FeedbackPostWithDetails[]> {
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
        )
      `
      )
      .eq('status', 'active')
      .order('is_pinned', { ascending: false })
      .order('last_activity_at', { ascending: false })
      .limit(limit);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    return (data || []).map((post) => ({
      ...post,
      category_name: post.feedback_categories?.name,
      category_slug: post.feedback_categories?.slug,
      category_icon: post.feedback_categories?.icon,
    }));
  } catch (error) {
    console.error('Error in getFeedbackPosts:', error);
    throw error;
  }
}

/**
 * Create a feedback post
 */
export async function createFeedbackPost(
  pilotUserId: string,
  data: {
    category_id: string;
    title: string;
    content: string;
    is_anonymous: boolean;
    tags?: string[];
  }
): Promise<{ success: boolean; error?: string; postId?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get pilot user details
    const { data: pilotUser, error: pilotError } = await supabaseAdmin
      .from('pilot_users')
      .select('first_name, last_name, rank, registration_approved')
      .eq('id', pilotUserId)
      .single();

    if (pilotError || !pilotUser || !pilotUser.registration_approved) {
      return {
        success: false,
        error: 'User not found or not approved',
      };
    }

    // Prepare post data
    const authorDisplayName = data.is_anonymous
      ? 'Anonymous Pilot'
      : `${pilotUser.first_name} ${pilotUser.last_name}`;

    const postData: FeedbackPostInsert = {
      pilot_user_id: pilotUserId,
      category_id: data.category_id,
      is_anonymous: data.is_anonymous,
      author_display_name: authorDisplayName,
      author_rank: data.is_anonymous ? null : pilotUser.rank,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      status: 'active',
    };

    const { data: newPost, error: insertError } = await supabaseAdmin
      .from('feedback_posts')
      .insert(postData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating post:', insertError);
      return {
        success: false,
        error: 'Failed to create post',
      };
    }

    console.log('✅ Feedback post created:', newPost.id);

    return {
      success: true,
      postId: newPost.id,
    };
  } catch (error) {
    console.error('Error in createFeedbackPost:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get a single feedback post with details
 */
export async function getFeedbackPostById(postId: string): Promise<FeedbackPostWithDetails | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: post, error } = await supabaseAdmin
      .from('feedback_posts')
      .select(
        `
        *,
        feedback_categories!inner (
          name,
          slug,
          icon
        )
      `
      )
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return null;
    }

    if (!post) return null;

    return {
      ...post,
      category_name: post.feedback_categories?.name,
      category_slug: post.feedback_categories?.slug,
      category_icon: post.feedback_categories?.icon,
    };
  } catch (error) {
    console.error('Error in getFeedbackPostById:', error);
    return null;
  }
}

/**
 * Increment post view count
 */
export async function incrementPostViewCount(postId: string): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Call the database function
    await supabaseAdmin.rpc('increment_post_view_count', { p_post_id: postId });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

/**
 * Get comments for a feedback post
 */
export async function getPostComments(postId: string): Promise<FeedbackCommentWithAuthor[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('feedback_comments')
      .select('*')
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPostComments:', error);
    throw error;
  }
}

/**
 * Create a comment on a feedback post
 */
export async function createComment(
  pilotUserId: string,
  postId: string,
  content: string,
  parentCommentId?: string
): Promise<{ success: boolean; error?: string; commentId?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get pilot user details and check if post is anonymous
    const [pilotResult, postResult] = await Promise.all([
      supabaseAdmin
        .from('pilot_users')
        .select('first_name, last_name, rank, registration_approved')
        .eq('id', pilotUserId)
        .single(),
      supabaseAdmin.from('feedback_posts').select('is_anonymous').eq('id', postId).single(),
    ]);

    if (pilotResult.error || !pilotResult.data || !pilotResult.data.registration_approved) {
      return {
        success: false,
        error: 'User not found or not approved',
      };
    }

    if (postResult.error || !postResult.data) {
      return {
        success: false,
        error: 'Post not found',
      };
    }

    const pilotUser = pilotResult.data;
    const post = postResult.data;

    // Comment author name
    const authorName = `${pilotUser.first_name} ${pilotUser.last_name}`;

    const commentData: FeedbackCommentInsert = {
      post_id: postId,
      pilot_user_id: pilotUserId,
      parent_comment_id: parentCommentId || null,
      author_name: authorName,
      author_rank: pilotUser.rank,
      content,
    };

    const { data: newComment, error: insertError } = await supabaseAdmin
      .from('feedback_comments')
      .insert(commentData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return {
        success: false,
        error: 'Failed to create comment',
      };
    }

    console.log('✅ Comment created:', newComment.id);

    return {
      success: true,
      commentId: newComment.id,
    };
  } catch (error) {
    console.error('Error in createComment:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(
  pilotUserId: string,
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Check if comment belongs to user
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('feedback_comments')
      .select('pilot_user_id, created_at')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return {
        success: false,
        error: 'Comment not found',
      };
    }

    if (comment.pilot_user_id !== pilotUserId) {
      return {
        success: false,
        error: 'You can only delete your own comments',
      };
    }

    // Check if comment is within 1 hour
    const commentAge = Date.now() - new Date(comment.created_at).getTime();
    const oneHour = 60 * 60 * 1000;

    if (commentAge > oneHour) {
      return {
        success: false,
        error: 'Comments can only be deleted within 1 hour of posting',
      };
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('feedback_comments')
      .update({
        deleted_at: new Date().toISOString(),
        content: '[Comment deleted by author]',
      })
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return {
        success: false,
        error: 'Failed to delete comment',
      };
    }

    console.log('✅ Comment deleted:', commentId);

    return { success: true };
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
