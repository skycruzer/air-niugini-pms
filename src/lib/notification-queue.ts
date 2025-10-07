/**
 * Air Niugini B767 Pilot Management System
 * Notification Queue Service
 *
 * Manages queued notifications for reliable delivery with retry logic
 * Features:
 * - Queue notifications for batch sending
 * - Automatic retry with exponential backoff
 * - Priority-based delivery
 * - Delivery tracking and logging
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import {
  sendCertificationExpiryAlert,
  sendLeaveRequestNotification,
  sendLeaveApprovalNotification,
  sendSystemNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  type EmailRecipient,
  type CertificationExpiryData,
  type LeaveRequestData,
  type SystemNotificationData,
} from '@/lib/email-service';

// ============================================================================
// TYPES
// ============================================================================

export interface QueuedNotification {
  id?: string;
  user_id?: string;
  email_address: string;
  notification_type:
    | 'certification_expiry'
    | 'leave_request'
    | 'leave_approval'
    | 'system'
    | 'welcome'
    | 'password_reset';
  subject: string;
  template_name: string;
  template_data: Record<string, any>;
  priority?: number; // 1 (highest) to 10 (lowest)
  scheduled_for?: Date;
}

export interface ProcessQueueResult {
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// QUEUE NOTIFICATION
// ============================================================================

export async function queueNotification(
  notification: QueuedNotification
): Promise<{ success: boolean; queueId?: string; error?: string }> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data, error } = await supabaseAdmin
      .from('notification_queue')
      .insert({
        user_id: notification.user_id || null,
        email_address: notification.email_address,
        notification_type: notification.notification_type,
        subject: notification.subject,
        template_name: notification.template_name,
        template_data: notification.template_data,
        priority: notification.priority || 5,
        scheduled_for: notification.scheduled_for || new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to queue notification', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }

    logger.info('Notification queued successfully', { data: data.id });
    return { success: true, queueId: data.id };
  } catch (error) {
    logger.error('Error queuing notification', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// QUEUE BATCH NOTIFICATIONS
// ============================================================================

export async function queueBatchNotifications(
  notifications: QueuedNotification[]
): Promise<{ success: boolean; queuedCount: number; errors: string[] }> {
  const supabaseAdmin = getSupabaseAdmin();
  let queuedCount = 0;
  const errors: string[] = [];

  try {
    const records = notifications.map((notif) => ({
      user_id: notif.user_id || null,
      email_address: notif.email_address,
      notification_type: notif.notification_type,
      subject: notif.subject,
      template_name: notif.template_name,
      template_data: notif.template_data,
      priority: notif.priority || 5,
      scheduled_for: notif.scheduled_for || new Date().toISOString(),
      status: 'pending',
    }));

    const { data, error } = await supabaseAdmin.from('notification_queue').insert(records).select();

    if (error) {
      logger.error('Failed to queue batch notifications', error instanceof Error ? error : new Error(String(error)));
      return { success: false, queuedCount: 0, errors: [error.message] };
    }

    queuedCount = data?.length || 0;
    logger.debug('Successfully queued ${queuedCount} notifications');

    return { success: true, queuedCount, errors: [] };
  } catch (error) {
    logger.error('Error queuing batch notifications', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      queuedCount,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// PROCESS NOTIFICATION QUEUE
// ============================================================================

export async function processNotificationQueue(limit: number = 50): Promise<ProcessQueueResult> {
  const supabaseAdmin = getSupabaseAdmin();
  let processed = 0;
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Get pending notifications ordered by priority and scheduled time
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true }) // Lower priority number = higher priority
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      logger.debug('No pending notifications to process');
      return { processed: 0, successful: 0, failed: 0, errors: [] };
    }

    logger.debug('Processing ${notifications.length} notifications...');

    // Process each notification
    for (const notif of notifications) {
      processed++;

      try {
        // Check if we should retry (based on attempts and max_attempts)
        if (notif.attempts >= notif.max_attempts) {
          console.warn(`Notification ${notif.id} exceeded max attempts, marking as failed`);
          await updateNotificationStatus(notif.id, 'failed', 'Max retry attempts reached');
          failed++;
          continue;
        }

        // Send the notification based on type
        const result = await sendQueuedNotification(notif);

        if (result.success) {
          // Mark as sent and log success
          await updateNotificationStatus(notif.id, 'sent');
          await logNotification(notif, 'delivered', result.messageId);
          successful++;
        } else {
          // Increment attempts and schedule retry
          const nextRetry = calculateNextRetry(notif.attempts + 1);
          await updateNotificationAttempt(notif.id, result.error || 'Unknown error', nextRetry);
          failed++;
          errors.push(`${notif.id}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error processing notification ${notif.id}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        const nextRetry = calculateNextRetry(notif.attempts + 1);
        await updateNotificationAttempt(notif.id, errorMsg, nextRetry);
        failed++;
        errors.push(`${notif.id}: ${errorMsg}`);
      }
    }

    console.log(
      `Queue processing complete: ${successful} successful, ${failed} failed out of ${processed} processed`
    );
    return { processed, successful, failed, errors };
  } catch (error) {
    logger.error('Error processing notification queue', error instanceof Error ? error : new Error(String(error)));
    return {
      processed,
      successful,
      failed,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// SEND QUEUED NOTIFICATION
// ============================================================================

async function sendQueuedNotification(
  notif: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const recipient: EmailRecipient = {
    email: notif.email_address,
    name: notif.template_data.recipient_name,
  };

  try {
    switch (notif.notification_type) {
      case 'certification_expiry': {
        const data: CertificationExpiryData = {
          pilotId: notif.template_data.pilot_id,
          pilotName: notif.template_data.pilot_name,
          employeeId: notif.template_data.employee_id,
          checkCode: notif.template_data.check_code,
          checkDescription: notif.template_data.check_description,
          expiryDate: new Date(notif.template_data.expiry_date),
          daysRemaining: notif.template_data.days_remaining,
          category: notif.template_data.category,
        };
        return await sendCertificationExpiryAlert(recipient, data);
      }

      case 'leave_request': {
        const data: LeaveRequestData = {
          pilotName: notif.template_data.pilot_name,
          leaveType: notif.template_data.leave_type,
          startDate: new Date(notif.template_data.start_date),
          endDate: new Date(notif.template_data.end_date),
          rosterPeriod: notif.template_data.roster_period,
          comments: notif.template_data.comments,
        };
        return await sendLeaveRequestNotification(recipient, data);
      }

      case 'leave_approval': {
        const data: LeaveRequestData = {
          pilotName: notif.template_data.pilot_name,
          leaveType: notif.template_data.leave_type,
          startDate: new Date(notif.template_data.start_date),
          endDate: new Date(notif.template_data.end_date),
          rosterPeriod: notif.template_data.roster_period,
          status: notif.template_data.status,
          comments: notif.template_data.comments,
          approverName: notif.template_data.approver_name,
        };
        const approved = notif.template_data.approved === true;
        return await sendLeaveApprovalNotification(recipient, data, approved);
      }

      case 'system': {
        const data: SystemNotificationData = {
          title: notif.template_data.title,
          message: notif.template_data.message,
          actionUrl: notif.template_data.action_url,
          priority: notif.template_data.priority || 'medium',
        };
        return await sendSystemNotification(recipient, data);
      }

      case 'welcome': {
        return await sendWelcomeEmail(recipient, notif.template_data.temporary_password);
      }

      case 'password_reset': {
        return await sendPasswordResetEmail(recipient, notif.template_data.reset_token);
      }

      default:
        return { success: false, error: `Unknown notification type: ${notif.notification_type}` };
    }
  } catch (error) {
    logger.error('Error sending queued notification', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// UPDATE NOTIFICATION STATUS
// ============================================================================

async function updateNotificationStatus(
  notificationId: string,
  status: 'sent' | 'failed' | 'cancelled',
  errorMessage?: string
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabaseAdmin
    .from('notification_queue')
    .update(updateData)
    .eq('id', notificationId);

  if (error) {
    logger.error('Failed to update notification status', error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================================
// UPDATE NOTIFICATION ATTEMPT
// ============================================================================

async function updateNotificationAttempt(
  notificationId: string,
  errorMessage: string,
  nextRetryAt: Date
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from('notification_queue')
    .update({
      attempts: supabaseAdmin.rpc('increment_attempts'),
      last_attempt_at: new Date().toISOString(),
      next_retry_at: nextRetryAt.toISOString(),
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    logger.error('Failed to update notification attempt', error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================================
// LOG NOTIFICATION
// ============================================================================

async function logNotification(
  notification: any,
  status: 'delivered' | 'bounced' | 'complained' | 'failed',
  messageId?: string
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.from('notification_log').insert({
    queue_id: notification.id,
    user_id: notification.user_id,
    email_address: notification.email_address,
    notification_type: notification.notification_type,
    subject: notification.subject,
    template_name: notification.template_name,
    status,
    delivery_provider: 'resend',
    provider_message_id: messageId,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    logger.error('Failed to log notification', error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================================
// CALCULATE NEXT RETRY TIME (Exponential Backoff)
// ============================================================================

function calculateNextRetry(attemptNumber: number): Date {
  // Exponential backoff: 5min, 15min, 1hr
  const delays = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];
  const delayMs = delays[Math.min(attemptNumber - 1, delays.length - 1)];

  const nextRetry = new Date();
  nextRetry.setTime(nextRetry.getTime() + delayMs);

  return nextRetry;
}

// ============================================================================
// CANCEL NOTIFICATION
// ============================================================================

export async function cancelNotification(notificationId: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from('notification_queue')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('status', 'pending'); // Only cancel pending notifications

  if (error) {
    logger.error('Failed to cancel notification', error instanceof Error ? error : new Error(String(error)));
    return false;
  }

  return true;
}

// ============================================================================
// GET NOTIFICATION STATUS
// ============================================================================

export async function getNotificationStatus(notificationId: string): Promise<any> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('notification_queue')
    .select('*')
    .eq('id', notificationId)
    .single();

  if (error) {
    logger.error('Failed to get notification status', error instanceof Error ? error : new Error(String(error)));
    return null;
  }

  return data;
}

// ============================================================================
// GET PENDING NOTIFICATIONS COUNT
// ============================================================================

export async function getPendingNotificationsCount(): Promise<number> {
  const supabaseAdmin = getSupabaseAdmin();

  const { count, error } = await supabaseAdmin
    .from('notification_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    logger.error('Failed to get pending notifications count', error instanceof Error ? error : new Error(String(error)));
    return 0;
  }

  return count || 0;
}

// ============================================================================
// CLEANUP OLD QUEUE ITEMS
// ============================================================================

export async function cleanupOldQueueItems(): Promise<number> {
  const supabaseAdmin = getSupabaseAdmin();

  // Delete sent/cancelled items older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error } = await supabaseAdmin
    .from('notification_queue')
    .delete()
    .in('status', ['sent', 'cancelled'])
    .lt('updated_at', sevenDaysAgo.toISOString());

  if (error) {
    logger.error('Failed to cleanup old queue items', error instanceof Error ? error : new Error(String(error)));
    return 0;
  }

  logger.debug('Cleaned up old queue items');
  return 0;
}
