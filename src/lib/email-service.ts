/**
 * Air Niugini B767 Pilot Management System
 * Email Service - Resend Integration
 *
 * Handles all email notifications with Air Niugini branding
 * Features:
 * - Certification expiry alerts (30/7 days before)
 * - Leave request notifications
 * - Leave approval/rejection notifications
 * - System alerts
 * - Welcome emails
 * - Password reset emails
 */

import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { differenceInDays, format } from 'date-fns';
import { logger } from '@/lib/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_123');

const FROM_EMAIL =
  process.env.EMAIL_FROM || 'Air Niugini Fleet Operations <notifications@airniugini.com>';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO || 'fleetops@airniugini.com.pg';

// Air Niugini Brand Colors
export const BRAND_COLORS = {
  red: '#4F46E5',
  gold: '#06B6D4',
  black: '#000000',
  white: '#FFFFFF',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface CertificationExpiryData {
  pilotId: string;
  pilotName: string;
  employeeId: string;
  checkCode: string;
  checkDescription: string;
  expiryDate: Date;
  daysRemaining: number;
  category: string;
}

export interface LeaveRequestData {
  pilotName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  rosterPeriod: string;
  status?: string;
  comments?: string;
  approverName?: string;
}

export interface SystemNotificationData {
  title: string;
  message: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// CORE EMAIL SENDING FUNCTION
// ============================================================================

async function sendEmail(
  to: EmailRecipient | EmailRecipient[],
  subject: string,
  html: string,
  options?: {
    replyTo?: string;
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
  }
): Promise<EmailResult> {
  try {
    const recipients = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients.map((r) => r.email),
      subject,
      html,
      replyTo: options?.replyTo || REPLY_TO_EMAIL,
      ...(options?.cc && { cc: options.cc.map((r) => r.email) }),
      ...(options?.bcc && { bcc: options.bcc.map((r) => r.email) }),
    });

    if (error) {
      logger.error('Email send error', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }

    logger.info('Email sent successfully', { data: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('Email service error', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// EMAIL TEMPLATE WRAPPER
// ============================================================================

function wrapEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background-color: ${BRAND_COLORS.red};
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            color: ${BRAND_COLORS.white};
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 40px;
            color: #333333;
            line-height: 1.6;
        }
        .content h2 {
            color: ${BRAND_COLORS.red};
            margin-top: 0;
        }
        .info-box {
            background-color: #f9f9f9;
            border-left: 4px solid ${BRAND_COLORS.gold};
            padding: 20px;
            margin: 20px 0;
        }
        .info-box strong {
            color: ${BRAND_COLORS.red};
        }
        .button {
            display: inline-block;
            background-color: ${BRAND_COLORS.red};
            color: ${BRAND_COLORS.white} !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: 600;
        }
        .button:hover {
            background-color: #c00020;
        }
        .alert-critical {
            background-color: #fee;
            border-left-color: ${BRAND_COLORS.red};
        }
        .alert-warning {
            background-color: #fffbf0;
            border-left-color: ${BRAND_COLORS.gold};
        }
        .footer {
            background-color: #f9f9f9;
            padding: 30px 40px;
            text-align: center;
            color: #666666;
            font-size: 14px;
            border-top: 3px solid ${BRAND_COLORS.gold};
        }
        .footer-logo {
            margin-bottom: 10px;
        }
        .unsubscribe {
            margin-top: 20px;
            font-size: 12px;
        }
        .unsubscribe a {
            color: #666666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>✈️ Air Niugini Fleet Operations</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <div class="footer-logo">
                <strong style="color: ${BRAND_COLORS.red};">Air Niugini</strong>
                <span style="color: ${BRAND_COLORS.gold};"> | </span>
                <span>Papua New Guinea's National Airline</span>
            </div>
            <p>B767 Fleet Operations Management System</p>
            <p>Jacksons International Airport, Port Moresby, Papua New Guinea</p>
            <div class="unsubscribe">
                <a href="{{unsubscribe_url}}">Update notification preferences</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// ============================================================================
// CERTIFICATION EXPIRY ALERT
// ============================================================================

export async function sendCertificationExpiryAlert(
  recipient: EmailRecipient,
  data: CertificationExpiryData
): Promise<EmailResult> {
  const alertClass = data.daysRemaining <= 7 ? 'alert-critical' : 'alert-warning';
  const urgency = data.daysRemaining <= 7 ? 'URGENT: ' : '';

  const content = `
        <h2>${urgency}Certification Expiry Alert</h2>
        <p>Dear ${recipient.name || 'Team'},</p>
        <p>This is an automated reminder that the following pilot certification requires attention:</p>

        <div class="info-box ${alertClass}">
            <p><strong>Pilot:</strong> ${data.pilotName} (${data.employeeId})</p>
            <p><strong>Check Type:</strong> ${data.checkCode} - ${data.checkDescription}</p>
            <p><strong>Category:</strong> ${data.category}</p>
            <p><strong>Expiry Date:</strong> ${format(data.expiryDate, 'dd MMM yyyy')}</p>
            <p><strong>Days Remaining:</strong> <span style="color: ${BRAND_COLORS.red}; font-weight: 700;">${data.daysRemaining} days</span></p>
        </div>

        <p>${data.daysRemaining <= 7 ? `<strong style="color: ${  BRAND_COLORS.red  };">URGENT ACTION REQUIRED:</strong> ` : ''}Please ensure that renewal is scheduled before the expiry date to maintain compliance.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/certifications?pilot=${data.pilotId}" class="button">
            View Certification Details
        </a>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            This is an automated notification from the Air Niugini B767 Pilot Management System.
        </p>
    `;

  return sendEmail(
    recipient,
    `${urgency}Certification Expiry Alert - ${data.pilotName} - ${data.checkCode}`,
    wrapEmailTemplate(content, 'Certification Expiry Alert')
  );
}

// ============================================================================
// LEAVE REQUEST NOTIFICATION
// ============================================================================

export async function sendLeaveRequestNotification(
  recipient: EmailRecipient,
  data: LeaveRequestData
): Promise<EmailResult> {
  const content = `
        <h2>New Leave Request Submitted</h2>
        <p>Dear ${recipient.name || 'Manager'},</p>
        <p>A new leave request has been submitted and requires your review:</p>

        <div class="info-box">
            <p><strong>Pilot:</strong> ${data.pilotName}</p>
            <p><strong>Leave Type:</strong> ${data.leaveType}</p>
            <p><strong>Start Date:</strong> ${format(data.startDate, 'dd MMM yyyy')}</p>
            <p><strong>End Date:</strong> ${format(data.endDate, 'dd MMM yyyy')}</p>
            <p><strong>Roster Period:</strong> ${data.rosterPeriod}</p>
            <p><strong>Duration:</strong> ${differenceInDays(data.endDate, data.startDate) + 1} day(s)</p>
        </div>

        ${data.comments ? `<p><strong>Comments:</strong><br>${data.comments}</p>` : ''}

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leave" class="button">
            Review Leave Request
        </a>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Please review and approve or reject this request at your earliest convenience.
        </p>
    `;

  return sendEmail(
    recipient,
    `New Leave Request - ${data.pilotName} - ${data.rosterPeriod}`,
    wrapEmailTemplate(content, 'New Leave Request')
  );
}

// ============================================================================
// LEAVE APPROVAL NOTIFICATION
// ============================================================================

export async function sendLeaveApprovalNotification(
  recipient: EmailRecipient,
  data: LeaveRequestData,
  approved: boolean
): Promise<EmailResult> {
  const statusText = approved ? 'APPROVED' : 'REJECTED';
  const statusColor = approved ? '#22c55e' : BRAND_COLORS.red;

  const content = `
        <h2>Leave Request ${statusText}</h2>
        <p>Dear ${data.pilotName},</p>
        <p>Your leave request has been <strong style="color: ${statusColor};">${statusText}</strong>.</p>

        <div class="info-box">
            <p><strong>Leave Type:</strong> ${data.leaveType}</p>
            <p><strong>Start Date:</strong> ${format(data.startDate, 'dd MMM yyyy')}</p>
            <p><strong>End Date:</strong> ${format(data.endDate, 'dd MMM yyyy')}</p>
            <p><strong>Roster Period:</strong> ${data.rosterPeriod}</p>
            <p><strong>Duration:</strong> ${differenceInDays(data.endDate, data.startDate) + 1} day(s)</p>
            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 700;">${statusText}</span></p>
        </div>

        ${data.approverName ? `<p><strong>Approved by:</strong> ${data.approverName}</p>` : ''}
        ${data.comments ? `<p><strong>Comments:</strong><br>${data.comments}</p>` : ''}

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leave" class="button">
            View Leave Details
        </a>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If you have any questions, please contact Fleet Operations.
        </p>
    `;

  return sendEmail(
    recipient,
    `Leave Request ${statusText} - ${data.rosterPeriod}`,
    wrapEmailTemplate(content, `Leave Request ${statusText}`)
  );
}

// ============================================================================
// SYSTEM NOTIFICATION
// ============================================================================

export async function sendSystemNotification(
  recipient: EmailRecipient | EmailRecipient[],
  data: SystemNotificationData
): Promise<EmailResult> {
  const priorityColors = {
    low: '#6b7280',
    medium: BRAND_COLORS.gold,
    high: '#f97316',
    critical: BRAND_COLORS.red,
  };

  const content = `
        <h2 style="color: ${priorityColors[data.priority]};">${data.title}</h2>
        <div class="info-box ${data.priority === 'critical' ? 'alert-critical' : data.priority === 'high' ? 'alert-warning' : ''}">
            <p>${data.message}</p>
        </div>

        ${
          data.actionUrl
            ? `
        <a href="${data.actionUrl}" class="button">
            Take Action
        </a>
        `
            : ''
        }

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            This is an automated system notification from Air Niugini Fleet Operations.
        </p>
    `;

  return sendEmail(
    recipient,
    `[${data.priority.toUpperCase()}] ${data.title}`,
    wrapEmailTemplate(content, data.title)
  );
}

// ============================================================================
// WELCOME EMAIL
// ============================================================================

export async function sendWelcomeEmail(
  recipient: EmailRecipient,
  temporaryPassword?: string
): Promise<EmailResult> {
  const content = `
        <h2>Welcome to Air Niugini Fleet Operations</h2>
        <p>Dear ${recipient.name || 'Colleague'},</p>
        <p>Welcome to the Air Niugini B767 Pilot Management System! Your account has been successfully created.</p>

        <div class="info-box">
            <p><strong>Email:</strong> ${recipient.email}</p>
            ${temporaryPassword ? `<p><strong>Temporary Password:</strong> ${temporaryPassword}</p>` : ''}
        </div>

        ${
          temporaryPassword
            ? `
        <p style="color: ${BRAND_COLORS.red};"><strong>Important:</strong> For security reasons, please change your password immediately after your first login.</p>
        `
            : ''
        }

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">
            Login to Your Account
        </a>

        <h3 style="color: ${BRAND_COLORS.red}; margin-top: 40px;">System Features:</h3>
        <ul>
            <li><strong>Pilot Certification Tracking</strong> - Monitor all certifications with expiry alerts</li>
            <li><strong>Leave Management</strong> - Submit and track RDO/WDO/Annual leave requests</li>
            <li><strong>Compliance Dashboard</strong> - Real-time fleet status and analytics</li>
            <li><strong>Automated Reporting</strong> - Generate comprehensive certification and leave reports</li>
        </ul>

        <p style="margin-top: 30px;">If you have any questions or need assistance, please contact the Fleet Operations team.</p>
    `;

  return sendEmail(
    recipient,
    'Welcome to Air Niugini Fleet Operations System',
    wrapEmailTemplate(content, 'Welcome to Air Niugini')
  );
}

// ============================================================================
// PASSWORD RESET EMAIL
// ============================================================================

export async function sendPasswordResetEmail(
  recipient: EmailRecipient,
  resetToken: string
): Promise<EmailResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const content = `
        <h2>Password Reset Request</h2>
        <p>Dear ${recipient.name || 'User'},</p>
        <p>We received a request to reset your password for the Air Niugini Fleet Operations System.</p>

        <div class="info-box alert-warning">
            <p><strong>Security Notice:</strong> This password reset link is valid for 1 hour only.</p>
        </div>

        <a href="${resetUrl}" class="button">
            Reset Your Password
        </a>

        <p style="margin-top: 30px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
            For security reasons, this link will expire in 1 hour. If you need to reset your password after this time, please submit a new request.
        </p>

        <p style="font-size: 12px; color: #999; margin-top: 20px;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
        </p>
    `;

  return sendEmail(
    recipient,
    'Password Reset Request - Air Niugini Fleet Operations',
    wrapEmailTemplate(content, 'Password Reset Request')
  );
}

// ============================================================================
// BATCH CERTIFICATION EXPIRY ALERTS
// ============================================================================

export async function sendBatchCertificationAlerts(
  daysAhead: number = 30
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const supabaseAdmin = getSupabaseAdmin();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Get all expiring certifications
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data: expiringCerts, error: certsError } = await supabaseAdmin
      .from('pilot_checks')
      .select(
        `
                id,
                expiry_date,
                pilots!inner (id, first_name, last_name, employee_id),
                check_types!inner (id, check_code, check_description, category)
            `
      )
      .not('expiry_date', 'is', null)
      .gte('expiry_date', today.toISOString().split('T')[0])
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (certsError) {
      throw certsError;
    }

    if (!expiringCerts || expiringCerts.length === 0) {
      return { sent: 0, failed: 0, errors: [] };
    }

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
      logger.warn('Could not load notification preferences:', prefsError);
    }

    const enabledUserIds = new Set(preferences?.map((p) => p.user_id) || []);

    // Send notifications
    for (const cert of expiringCerts) {
      const expiryDate = new Date(cert.expiry_date);
      const daysRemaining = differenceInDays(expiryDate, today);

      // Only notify at specific thresholds: 30, 14, 7, 3, 1 days
      const notificationThresholds = [30, 14, 7, 3, 1];
      if (!notificationThresholds.includes(daysRemaining)) {
        continue;
      }

      const certData: CertificationExpiryData = {
        pilotId: cert.pilots.id,
        pilotName: `${cert.pilots.first_name} ${cert.pilots.last_name}`,
        employeeId: cert.pilots.employee_id,
        checkCode: cert.check_types.check_code,
        checkDescription: cert.check_types.check_description,
        expiryDate,
        daysRemaining,
        category: cert.check_types.category,
      };

      // Send to admins/managers with notifications enabled
      for (const admin of admins || []) {
        if (!enabledUserIds.has(admin.id)) {
          continue; // Skip if notifications disabled
        }

        const result = await sendCertificationExpiryAlert(
          { email: admin.email, name: admin.name || undefined },
          certData
        );

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`Failed to send to ${admin.email}: ${result.error}`);
        }
      }
    }

    return { sent, failed, errors };
  } catch (error) {
    logger.error('Batch certification alerts error', error instanceof Error ? error : new Error(String(error)));
    return {
      sent,
      failed: failed + 1,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// UTILITY: GET USER NOTIFICATION PREFERENCES
// ============================================================================

export async function getUserNotificationPreferences(userId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching notification preferences', error instanceof Error ? error : new Error(String(error)));
    return null;
  }

  return data;
}

// ============================================================================
// UTILITY: CHECK IF USER CAN RECEIVE NOTIFICATION
// ============================================================================

export async function canUserReceiveNotification(
  userId: string,
  notificationType: string
): Promise<boolean> {
  const prefs = await getUserNotificationPreferences(userId);

  if (!prefs || !prefs.email_enabled) {
    return false;
  }

  switch (notificationType) {
    case 'certification_expiry':
      return prefs.certification_expiry_alerts;
    case 'leave_request':
      return prefs.leave_request_alerts;
    case 'leave_approval':
      return prefs.leave_approval_alerts;
    case 'system':
      return prefs.system_notifications;
    default:
      return true; // Allow unknown types by default
  }
}
