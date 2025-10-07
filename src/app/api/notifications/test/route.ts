/**
 * Air Niugini B767 Pilot Management System
 * API Route: Test Notification
 *
 * POST /api/notifications/test - Send a test notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  sendCertificationExpiryAlert,
  sendLeaveRequestNotification,
  sendSystemNotification,
  type EmailRecipient,
  type CertificationExpiryData,
  type LeaveRequestData,
  type SystemNotificationData,
} from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email || !body.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, name',
        },
        { status: 400 }
      );
    }

    const recipient: EmailRecipient = {
      email: body.email,
      name: body.name,
    };

    const testType = body.type || 'system';

    let result;

    switch (testType) {
      case 'certification_expiry': {
        const testData: CertificationExpiryData = {
          pilotId: 'test-pilot-id',
          pilotName: 'John Doe',
          employeeId: 'EMP001',
          checkCode: 'PC',
          checkDescription: 'Proficiency Check',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          daysRemaining: 7,
          category: 'Flight Operations',
        };
        result = await sendCertificationExpiryAlert(recipient, testData);
        break;
      }

      case 'leave_request': {
        const testData: LeaveRequestData = {
          pilotName: 'John Doe',
          leaveType: 'RDO',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
          rosterPeriod: 'RP11/2025',
          comments: 'This is a test leave request notification',
        };
        result = await sendLeaveRequestNotification(recipient, testData);
        break;
      }

      case 'system':
      default: {
        const testData: SystemNotificationData = {
          title: 'Test Notification',
          message:
            'This is a test notification from the Air Niugini Fleet Operations system. If you receive this email, the notification system is working correctly.',
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL  }/dashboard`,
          priority: 'medium',
        };
        result = await sendSystemNotification(recipient, testData);
        break;
      }
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test notification sent successfully to ${recipient.email}`,
    });
  } catch (error) {
    logger.error('API Error [/api/notifications/test]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
