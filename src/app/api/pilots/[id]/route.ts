import { NextRequest, NextResponse } from 'next/server';
import { deletePilot, getPilotById } from '@/lib/pilot-service';
import { logger } from '@/lib/logger';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pilotId = params.id;

    logger.debug(' DELETE /api/pilots/[id]: Starting deletion for pilot:', pilotId);

    // Check if pilot exists first
    const pilot = await getPilotById(pilotId);
    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Pilot not found' }, { status: 404 });
    }

    // Perform cascading deletion
    await deletePilot(pilotId);

    logger.info(' DELETE /api/pilots/[id]: Successfully deleted pilot:', pilotId);

    return NextResponse.json({
      success: true,
      message: 'Pilot and all related data deleted successfully',
    });
  } catch (error) {
    logger.error(' DELETE /api/pilots/[id]: Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete pilot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
