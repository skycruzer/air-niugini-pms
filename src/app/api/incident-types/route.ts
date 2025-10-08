/**
 * @fileoverview Incident Types API routes
 * Handles fetching incident types for disciplinary matter forms
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/incident-types
 * Retrieves all incident types for dropdown selection
 * Public endpoint - No auth required (reference data only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: incidentTypes, error } = await supabaseAdmin
      .from('incident_types')
      .select('id, code, name, description, severity_level, requires_review')
      .order('name', { ascending: true});

    if (error) {
      logger.error('Error fetching incident types:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch incident types',
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: incidentTypes,
    });

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    logger.error('Error in GET /api/incident-types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch incident types',
      },
      { status: 500 }
    );
  }
}
