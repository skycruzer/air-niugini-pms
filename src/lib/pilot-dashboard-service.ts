/**
 * Pilot Dashboard Service
 * Fetches dashboard statistics and recent activity for pilot users
 */

import { createClient } from './supabase-browser';

const supabase = createClient();

export interface DashboardStats {
  approvedLeaves: number;
  pendingRequests: number;
  feedbackPosts: number;
  unreadNotifications: number;
}

export interface RecentActivity {
  id: string;
  type: 'leave_request' | 'feedback_post';
  description: string;
  date: string;
  status?: string;
}

/**
 * Get dashboard statistics for the authenticated pilot
 */
export async function getPilotDashboardStats(pilotUserId: string): Promise<DashboardStats> {
  try {
    // Get leave request counts
    const { data: leaveRequests } = await supabase
      .from('leave_requests')
      .select('status', { count: 'exact', head: true })
      .eq('pilot_user_id', pilotUserId);

    // Get approved leaves count (this year)
    const currentYear = new Date().getFullYear();
    const { count: approvedCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_user_id', pilotUserId)
      .eq('status', 'APPROVED')
      .gte('created_at', `${currentYear}-01-01`)
      .lte('created_at', `${currentYear}-12-31`);

    // Get pending requests count
    const { count: pendingCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_user_id', pilotUserId)
      .eq('status', 'PENDING');

    // Get feedback posts count
    const { count: feedbackCount } = await supabase
      .from('feedback_posts')
      .select('*', { count: 'exact', head: true })
      .eq('pilot_user_id', pilotUserId);

    // Get unread notifications count
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', pilotUserId)
      .eq('recipient_type', 'pilot')
      .eq('is_read', false);

    return {
      approvedLeaves: approvedCount || 0,
      pendingRequests: pendingCount || 0,
      feedbackPosts: feedbackCount || 0,
      unreadNotifications: unreadNotifications || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      approvedLeaves: 0,
      pendingRequests: 0,
      feedbackPosts: 0,
      unreadNotifications: 0,
    };
  }
}

/**
 * Get recent activity for the authenticated pilot
 */
export async function getPilotRecentActivity(
  pilotUserId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = [];

    // Get recent leave requests
    const { data: leaveRequests } = await supabase
      .from('leave_requests')
      .select('id, request_type, start_date, end_date, status, created_at')
      .eq('pilot_user_id', pilotUserId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (leaveRequests) {
      leaveRequests.forEach((request) => {
        activities.push({
          id: request.id,
          type: 'leave_request',
          description: `${request.request_type} leave request: ${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`,
          date: request.created_at,
          status: request.status,
        });
      });
    }

    // Get recent feedback posts
    const { data: feedbackPosts } = await supabase
      .from('feedback_posts')
      .select('id, title, created_at')
      .eq('pilot_user_id', pilotUserId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (feedbackPosts) {
      feedbackPosts.forEach((post) => {
        activities.push({
          id: post.id,
          type: 'feedback_post',
          description: `Posted feedback: ${post.title}`,
          date: post.created_at,
        });
      });
    }

    // Sort all activities by date (most recent first) and limit
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}
