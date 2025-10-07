import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getPilotsNearingRetirementForDashboard } from '@/lib/pilot-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.debug('Retirement API: Starting request');

    // Get pilots nearing retirement
    const nearingRetirement = await getPilotsNearingRetirementForDashboard();

    logger.info('Retirement API: Found pilots nearing retirement', { count: nearingRetirement.length });

    // Count pilots by status
    let dueSoon = 0;
    let overdue = 0;

    nearingRetirement.forEach((pilot) => {
      if (pilot.retirement) {
        switch (pilot.retirement.retirementStatus) {
          case 'due_soon':
            dueSoon++;
            break;
          case 'overdue':
            overdue++;
            break;
        }
      }
    });

    const retirementData = {
      nearingRetirement: nearingRetirement.length,
      dueSoon,
      overdue,
      pilots: nearingRetirement.map((pilot) => ({
        id: pilot.id,
        name: `${pilot.first_name} ${pilot.last_name}`,
        retirement: pilot.retirement,
      })),
    };

    logger.info('Retirement API: Successfully calculated retirement metrics', {
      total: nearingRetirement.length,
      dueSoon,
      overdue
    });

    return NextResponse.json({
      success: true,
      data: retirementData,
    });
  } catch (error) {
    logger.error('Retirement API: Error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch retirement data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
