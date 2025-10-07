/**
 * LEAVE ELIGIBILITY CHECK API ROUTE
 *
 * POST /api/leave-eligibility/check
 * Check eligibility for a single leave request based on crew requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkLeaveEligibility } from '@/lib/leave-eligibility-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pilotId, pilotRole, startDate, endDate, requestType, requestId } = body;

    logger.debug('API /leave-eligibility/check: Received request', {
      pilotId,
      pilotRole,
      startDate,
      endDate,
      requestType,
      requestId,
    });

    if (!pilotId || !pilotRole || !startDate || !endDate) {
      logger.warn('API /leave-eligibility/check: Missing required fields');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: pilotId, pilotRole, startDate, endDate',
        },
        { status: 400 }
      );
    }

    const eligibility = await checkLeaveEligibility({
      requestId,
      pilotId,
      pilotRole,
      startDate,
      endDate,
      requestType: requestType || 'ANNUAL',
    });

    logger.info('API /leave-eligibility/check: Eligibility check complete', {
      isEligible: eligibility.isEligible,
      recommendation: eligibility.recommendation,
      conflictCount: eligibility.conflicts.length,
    });

    return NextResponse.json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    logger.error('API /leave-eligibility/check: Error', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check eligibility',
      },
      { status: 500 }
    );
  }
}
