/**
 * Admin Pilot Registrations API
 * GET /api/admin/pilot-registrations - Get all pending registrations
 *
 * NOTE: This endpoint uses admin client to bypass RLS.
 * Access control is handled by ProtectedRoute component on the frontend.
 * Follows the same pattern as /api/leave-requests
 */

import { NextResponse } from 'next/server';
import { getPendingRegistrations } from '@/lib/pilot-registration-service';
import { logger } from '@/lib/logger';

/**
 * GET - Get all pending pilot registrations
 */
export async function GET() {
  try {
    logger.debug('📋 API /admin/pilot-registrations: Fetching pending registrations...');

    // Get pending registrations using admin client (bypasses RLS)
    const registrations = await getPendingRegistrations();

    logger.debug('✅ API /admin/pilot-registrations: Found', registrations.length, 'pending registrations');

    return NextResponse.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    logger.error('❌ API /admin/pilot-registrations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch registrations',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
