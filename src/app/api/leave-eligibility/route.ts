/**
 * LEAVE ELIGIBILITY API ROUTE
 *
 * Endpoints for checking leave request eligibility based on crew requirements
 * and seniority-based recommendations.
 *
 * POST /api/leave-eligibility/check - Check single leave request
 * POST /api/leave-eligibility/bulk - Check multiple requests for a roster period
 * GET /api/leave-eligibility/availability?start=YYYY-MM-DD&end=YYYY-MM-DD - Get crew availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  checkLeaveEligibility,
  checkBulkLeaveEligibility,
  calculateCrewAvailability,
  getCrewRequirements,
} from '@/lib/leave-eligibility-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leave-eligibility/check
 * Check eligibility for a single leave request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pilotId, pilotRole, startDate, endDate, requestType, requestId } = body;

    if (!pilotId || !pilotRole || !startDate || !endDate) {
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

    return NextResponse.json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    logger.error('Error checking leave eligibility:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check leave eligibility',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leave-eligibility/bulk?rosterPeriod=RP11/2025
 * Check eligibility for all pending requests in a roster period
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'bulk') {
      const rosterPeriod = searchParams.get('rosterPeriod');
      if (!rosterPeriod) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required parameter: rosterPeriod',
          },
          { status: 400 }
        );
      }

      const result = await checkBulkLeaveEligibility(rosterPeriod);
      return NextResponse.json({
        success: true,
        data: {
          eligible: result.eligible,
          requiresReview: result.requiresReview,
          shouldDeny: result.shouldDeny,
          recommendations: Object.fromEntries(result.recommendations),
        },
      });
    }

    if (action === 'availability') {
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required parameters: startDate, endDate',
          },
          { status: 400 }
        );
      }

      const availability = await calculateCrewAvailability(startDate, endDate);
      const requirements = await getCrewRequirements();

      return NextResponse.json({
        success: true,
        data: {
          availability,
          requirements,
        },
      });
    }

    if (action === 'requirements') {
      const requirements = await getCrewRequirements();
      return NextResponse.json({
        success: true,
        data: requirements,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'Invalid action. Use: ?action=bulk&rosterPeriod=RP11/2025, ?action=availability&startDate=...&endDate=..., or ?action=requirements',
      },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error in leave eligibility GET:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500 }
    );
  }
}
