/**
 * Air Niugini B767 Pilot Management System
 * Scheduled Jobs Service
 *
 * Handles automated scheduled tasks:
 * - Daily certification expiry checks
 * - Batch notification sending
 * - Notification cleanup
 * - Daily digest emails
 */

import { differenceInDays, format } from 'date-fns';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  queueNotification,
  processNotificationQueue,
  cleanupOldQueueItems,
  type QueuedNotification,
} from '@/lib/notification-queue';
import { sendBatchCertificationAlerts } from '@/lib/email-service';

// ============================================================================
// TYPES
// ============================================================================

export interface JobResult {
  jobName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

// ============================================================================
// DAILY CERTIFICATION EXPIRY CHECK
// ============================================================================

export async function runDailyCertificationCheck(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = 'daily_certification_check';

  try {
    console.log('[Job] Starting daily certification expiry check...');

    const supabaseAdmin = getSupabaseAdmin();
    const today = new Date();

    // Define notification thresholds (days before expiry to notify)
    const notificationThresholds = [30, 14, 7, 3, 1]; // Standard thresholds
    const queued: QueuedNotification[] = [];

    // Get all active pilots with certifications
    const { data: expiringCerts, error: certsError } = await supabaseAdmin
      .from('pilot_checks')
      .select(
        `
                id,
                expiry_date,
                pilots!inner (
                    id,
                    first_name,
                    last_name,
                    employee_id,
                    email,
                    is_active
                ),
                check_types!inner (
                    id,
                    check_code,
                    check_description,
                    category
                )
            `
      )
      .not('expiry_date', 'is', null)
      .eq('pilots.is_active', true)
      .gte('expiry_date', today.toISOString().split('T')[0]);

    if (certsError) {
      throw certsError;
    }

    if (!expiringCerts || expiringCerts.length === 0) {
      console.log('[Job] No expiring certifications found');
      return {
        jobName,
        success: true,
        duration: Date.now() - startTime,
        details: { certificationsChecked: 0, notificationsQueued: 0 },
      };
    }

    console.log(`[Job] Checking ${expiringCerts.length} certifications...`);

    // Get admin/manager users to notify
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('an_users')
      .select('id, email, name, role')
      .in('role', ['admin', 'manager']);

    if (adminsError) {
      throw adminsError;
    }

    // Get notification preferences
    const { data: preferences, error: prefsError } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('email_enabled', true)
      .eq('certification_expiry_alerts', true);

    if (prefsError) {
      console.warn('[Job] Could not load notification preferences:', prefsError);
    }

    const enabledUserIds = new Set(preferences?.map((p) => p.user_id) || []);

    // Check each certification against thresholds
    for (const cert of expiringCerts) {
      const expiryDate = new Date(cert.expiry_date);
      const daysRemaining = differenceInDays(expiryDate, today);

      // Only notify at specific thresholds
      if (!notificationThresholds.includes(daysRemaining)) {
        continue;
      }

      // Check if we already sent a notification today for this cert
      const { data: existingLog } = await supabaseAdmin
        .from('notification_log')
        .select('id')
        .eq('notification_type', 'certification_expiry')
        .gte('sent_at', today.toISOString().split('T')[0])
        .limit(1);

      if (existingLog && existingLog.length > 0) {
        continue; // Already notified today
      }

      // Queue notifications for admins/managers
      for (const admin of admins || []) {
        if (!enabledUserIds.has(admin.id)) {
          continue; // Skip if notifications disabled
        }

        const notification: QueuedNotification = {
          user_id: admin.id,
          email_address: admin.email,
          notification_type: 'certification_expiry',
          subject: `${daysRemaining <= 7 ? 'URGENT: ' : ''}Certification Expiry Alert - ${cert.pilots.first_name} ${cert.pilots.last_name}`,
          template_name: 'certification_expiry_alert',
          template_data: {
            recipient_name: admin.name || 'Fleet Manager',
            pilot_id: cert.pilots.id,
            pilot_name: `${cert.pilots.first_name} ${cert.pilots.last_name}`,
            employee_id: cert.pilots.employee_id,
            check_code: cert.check_types.check_code,
            check_description: cert.check_types.check_description,
            category: cert.check_types.category,
            expiry_date: cert.expiry_date,
            days_remaining: daysRemaining,
          },
          priority: daysRemaining <= 7 ? 1 : daysRemaining <= 14 ? 2 : 3,
        };

        queued.push(notification);
      }
    }

    // Queue all notifications
    if (queued.length > 0) {
      const { queueBatchNotifications } = await import('@/lib/notification-queue');
      const result = await queueBatchNotifications(queued);
      console.log(`[Job] Queued ${result.queuedCount} certification expiry notifications`);
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Job] Daily certification check complete: ${expiringCerts.length} checked, ${queued.length} queued (${duration}ms)`
    );

    return {
      jobName,
      success: true,
      duration,
      details: {
        certificationsChecked: expiringCerts.length,
        notificationsQueued: queued.length,
      },
    };
  } catch (error) {
    console.error('[Job] Daily certification check failed:', error);
    return {
      jobName,
      success: false,
      duration: Date.now() - startTime,
      details: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// PROCESS NOTIFICATION QUEUE JOB
// ============================================================================

export async function runProcessNotificationQueue(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = 'process_notification_queue';

  try {
    console.log('[Job] Processing notification queue...');

    const result = await processNotificationQueue(100); // Process up to 100 notifications

    const duration = Date.now() - startTime;
    console.log(
      `[Job] Notification queue processed: ${result.successful} sent, ${result.failed} failed (${duration}ms)`
    );

    return {
      jobName,
      success: true,
      duration,
      details: result,
    };
  } catch (error) {
    console.error('[Job] Process notification queue failed:', error);
    return {
      jobName,
      success: false,
      duration: Date.now() - startTime,
      details: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CLEANUP OLD NOTIFICATIONS JOB
// ============================================================================

export async function runCleanupNotifications(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = 'cleanup_notifications';

  try {
    console.log('[Job] Cleaning up old notifications...');

    const supabaseAdmin = getSupabaseAdmin();

    // Call database cleanup function
    const { error } = await supabaseAdmin.rpc('cleanup_old_notifications');

    if (error) {
      throw error;
    }

    // Also cleanup old queue items
    await cleanupOldQueueItems();

    const duration = Date.now() - startTime;
    console.log(`[Job] Cleanup complete (${duration}ms)`);

    return {
      jobName,
      success: true,
      duration,
      details: { message: 'Cleanup completed successfully' },
    };
  } catch (error) {
    console.error('[Job] Cleanup notifications failed:', error);
    return {
      jobName,
      success: false,
      duration: Date.now() - startTime,
      details: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// DAILY DIGEST JOB
// ============================================================================

export async function runDailyDigest(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = 'daily_digest';

  try {
    console.log('[Job] Generating daily digest emails...');

    const supabaseAdmin = getSupabaseAdmin();
    const today = new Date();

    // Get users who want daily digest
    const { data: digestUsers, error: usersError } = await supabaseAdmin
      .from('notification_preferences')
      .select(
        `
                *,
                an_users!inner (id, email, name, role)
            `
      )
      .eq('email_enabled', true)
      .eq('daily_digest', true);

    if (usersError) {
      throw usersError;
    }

    if (!digestUsers || digestUsers.length === 0) {
      console.log('[Job] No users subscribed to daily digest');
      return {
        jobName,
        success: true,
        duration: Date.now() - startTime,
        details: { digestsSent: 0 },
      };
    }

    let digestsSent = 0;

    for (const user of digestUsers) {
      try {
        // Get summary data for this user
        const { data: expiringCerts } = await supabaseAdmin
          .from('pilot_checks')
          .select(
            `
                        id,
                        expiry_date,
                        pilots!inner (first_name, last_name, employee_id),
                        check_types!inner (check_code, check_description)
                    `
          )
          .not('expiry_date', 'is', null)
          .lte('expiry_date', new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(10);

        const { data: pendingLeave } = await supabaseAdmin
          .from('leave_requests')
          .select(
            `
                        id,
                        leave_type,
                        start_date,
                        end_date,
                        status,
                        pilots!inner (first_name, last_name)
                    `
          )
          .eq('status', 'pending')
          .limit(10);

        // Queue digest notification
        await queueNotification({
          user_id: user.an_users.id,
          email_address: user.an_users.email,
          notification_type: 'system',
          subject: `Daily Digest - ${format(today, 'dd MMM yyyy')}`,
          template_name: 'daily_digest',
          template_data: {
            recipient_name: user.an_users.name,
            date: format(today, 'dd MMMM yyyy'),
            expiring_certifications: expiringCerts || [],
            pending_leave_requests: pendingLeave || [],
          },
          priority: 5,
        });

        digestsSent++;
      } catch (error) {
        console.error(`[Job] Failed to queue digest for user ${user.an_users.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Job] Daily digest complete: ${digestsSent} queued (${duration}ms)`);

    return {
      jobName,
      success: true,
      duration,
      details: { digestsSent },
    };
  } catch (error) {
    console.error('[Job] Daily digest failed:', error);
    return {
      jobName,
      success: false,
      duration: Date.now() - startTime,
      details: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// RUN ALL SCHEDULED JOBS
// ============================================================================

export async function runAllScheduledJobs(): Promise<JobResult[]> {
  console.log('[Jobs] Running all scheduled jobs...');

  const results = await Promise.allSettled([
    runDailyCertificationCheck(),
    runProcessNotificationQueue(),
    runCleanupNotifications(),
    runDailyDigest(),
  ]);

  const jobResults: JobResult[] = results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        jobName: 'unknown',
        success: false,
        duration: 0,
        details: {},
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });

  const successful = jobResults.filter((r) => r.success).length;
  const failed = jobResults.filter((r) => !r.success).length;

  console.log(`[Jobs] All jobs complete: ${successful} successful, ${failed} failed`);

  return jobResults;
}

// ============================================================================
// CRON PATTERNS (for reference)
// ============================================================================

/**
 * Recommended cron patterns for scheduled jobs:
 *
 * Daily Certification Check:
 *   - Run daily at 8:00 AM: "0 8 * * *"
 *
 * Process Notification Queue:
 *   - Run every 5 minutes: "*//*5 * * * *"
 *   - Run every 15 minutes: "*//*15 * * * *"
 *
 * Cleanup Notifications:
 *   - Run daily at 2:00 AM: "0 2 * * *"
 *
 * Daily Digest:
 *   - Run daily at 7:00 AM: "0 7 * * *"
 */
