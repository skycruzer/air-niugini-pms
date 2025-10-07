import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface BulkUpdateRequest {
  checkTypeId: string;
  newExpiryDate: string;
  selectedPilots: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkUpdateRequest = await request.json();
    const { checkTypeId, newExpiryDate, selectedPilots } = body;

    if (!checkTypeId || !newExpiryDate || !selectedPilots || selectedPilots.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logger.debug(' API /certifications/bulk-update: Starting bulk update');
    logger.debug(' Check Type ID:', checkTypeId);
    logger.debug(' New Expiry Date:', newExpiryDate);
    logger.debug(' Selected Pilots:', selectedPilots.length);

    const supabaseAdmin = getSupabaseAdmin();

    // Validate check type exists
    const { data: checkType, error: checkTypeError } = await supabaseAdmin
      .from('check_types')
      .select('check_code, check_description')
      .eq('id', checkTypeId)
      .single();

    if (checkTypeError || !checkType) {
      logger.error(' Invalid check type ID:', checkTypeId);
      return NextResponse.json(
        { success: false, error: 'Invalid check type selected' },
        { status: 400 }
      );
    }

    // Validate pilots exist
    const { data: pilots, error: pilotsError } = await supabaseAdmin
      .from('pilots')
      .select('id, first_name, last_name, employee_id')
      .in('id', selectedPilots)
      .eq('is_active', true);

    if (pilotsError) {
      logger.error(' Error validating pilots:', pilotsError);
      return NextResponse.json(
        { success: false, error: 'Error validating selected pilots' },
        { status: 500 }
      );
    }

    if (!pilots || pilots.length !== selectedPilots.length) {
      logger.error(' Some selected pilots not found or inactive');
      return NextResponse.json(
        { success: false, error: 'Some selected pilots are invalid or inactive' },
        { status: 400 }
      );
    }

    // Prepare bulk upsert data
    const updates = selectedPilots.map((pilotId) => ({
      pilot_id: pilotId,
      check_type_id: checkTypeId,
      expiry_date: newExpiryDate,
      updated_at: new Date().toISOString(),
    }));

    logger.debug(' Performing bulk upsert for', updates.length, 'records');

    // Perform bulk upsert
    const { data, error: upsertError } = await supabaseAdmin
      .from('pilot_checks')
      .upsert(updates, {
        onConflict: 'pilot_id,check_type_id',
      })
      .select();

    if (upsertError) {
      logger.error(' Bulk upsert error:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to update certifications' },
        { status: 500 }
      );
    }

    logger.info(' Bulk update successful:', data?.length || 0, 'records updated');

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      pilots: selectedPilots.length,
      checkType: checkType.check_code,
      expiryDate: newExpiryDate,
      message: `Successfully updated ${checkType.check_code} certification for ${selectedPilots.length} pilots`,
    });
  } catch (error) {
    logger.error(' API /certifications/bulk-update: Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
