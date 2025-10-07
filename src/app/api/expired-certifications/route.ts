import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    logger.debug(' API /expired-certifications: Fetching pilots with expired certifications');

    // Calculate today's date
    const today = new Date().toISOString().split('T')[0];

    // Get expired certifications using a direct query
    // Join pilots, pilot_checks, and check_types tables
    const { data: expiredChecks, error } = await supabaseAdmin
      .from('pilot_checks')
      .select(
        `
        expiry_date,
        pilots (
          id,
          first_name,
          middle_name,
          last_name,
          employee_id
        ),
        check_types (
          check_code,
          check_description,
          category
        )
      `
      )
      .not('expiry_date', 'is', null)
      .lt('expiry_date', today)
      .order('expiry_date', { ascending: false });

    if (error) {
      logger.error(' API /expired-certifications: Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Group by pilot to avoid duplicates and get unique pilots with expired certs
    const pilotsMap = new Map();

    (expiredChecks || []).forEach((check: any) => {
      if (check.pilots?.id) {
        const pilotId = check.pilots.id;
        if (!pilotsMap.has(pilotId)) {
          pilotsMap.set(pilotId, {
            id: pilotId,
            name: `${check.pilots.first_name || ''} ${check.pilots.middle_name ? `${check.pilots.middle_name  } ` : ''}${check.pilots.last_name || ''}`.trim(),
            employeeId: check.pilots.employee_id || '',
            expiredCertifications: [],
          });
        }

        pilotsMap.get(pilotId).expiredCertifications.push({
          checkCode: check.check_types?.check_code || '',
          checkDescription: check.check_types?.check_description || '',
          category: check.check_types?.category || '',
          expiryDate: check.expiry_date,
        });
      }
    });

    const result = Array.from(pilotsMap.values());

    logger.debug(
      '🔍 API /expired-certifications: Found',
      result.length,
      'pilots with expired certifications'
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(' API /expired-certifications: Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
