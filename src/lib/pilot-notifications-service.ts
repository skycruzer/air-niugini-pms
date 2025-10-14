/**
 * Pilot Notifications Service
 * Fetches and manages notifications for pilot users
 */

import { createClient } from './supabase-browser';

const supabase = createClient();

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_type: string;
  sender_id: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: any;
  is_read: boolean | null;
  read_at: string | null;
  created_at: string | null;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  type?: string;
  limit?: number;
}

/**
 * Get notifications for the authenticated pilot
 */
export async function getPilotNotifications(
  pilotUserId: string,
  filters: NotificationFilters = {}
): Promise<Notification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', pilotUserId)
      .eq('recipient_type', 'pilot')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(pilotUserId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', pilotUserId)
      .eq('recipient_type', 'pilot')
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a pilot
 */
export async function markAllNotificationsAsRead(pilotUserId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('recipient_id', pilotUserId)
      .eq('recipient_type', 'pilot')
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'leave_request_submitted':
      return 'calendar-plus';
    case 'leave_request_approved':
      return 'check-circle';
    case 'leave_request_rejected':
      return 'x-circle';
    case 'leave_request_cancelled':
      return 'calendar-x';
    case 'post_reply':
      return 'message-square';
    case 'post_liked':
      return 'heart';
    case 'system_announcement':
      return 'megaphone';
    case 'certification_expiring':
      return 'alert-triangle';
    default:
      return 'bell';
  }
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: string): string {
  switch (type) {
    case 'leave_request_submitted':
      return 'blue';
    case 'leave_request_approved':
      return 'green';
    case 'leave_request_rejected':
      return 'red';
    case 'leave_request_cancelled':
      return 'gray';
    case 'post_reply':
      return 'purple';
    case 'post_liked':
      return 'pink';
    case 'system_announcement':
      return 'orange';
    case 'certification_expiring':
      return 'yellow';
    default:
      return 'gray';
  }
}
