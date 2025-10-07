/**
 * Air Niugini B767 Pilot Management System
 * Cron Job: Process Notification Queue
 *
 * POST /api/cron/process-queue
 * Schedule: Every 5 minutes
 * Purpose: Process pending notifications from queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { runProcessNotificationQueue } from '@/lib/scheduled-jobs';

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const cronSecret = request.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Processing notification queue...');

    const result = await runProcessNotificationQueue();

    return NextResponse.json({
      success: result.success,
      jobName: result.jobName,
      duration: result.duration,
      details: result.details,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Process queue failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
