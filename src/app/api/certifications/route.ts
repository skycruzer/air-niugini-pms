import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getCertificationStatus } from '@/lib/certification-utils';
import { logger } from '@/lib/logger';
import { invalidateCache, CACHE_INVALIDATION_PATTERNS } from '@/lib/cache-service';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pilotId = searchParams.get('pilotId');

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 });
    }

    logger.debug('API /certifications: Fetching certifications for pilot', { pilotId });

    // Get all check types using service role (bypasses RLS)
    const { data: checkTypes, error: checkTypesError } = await getSupabaseAdmin()
      .from('check_types')
      .select('*')
      .order('category', { ascending: true })
      .order('check_code', { ascending: true });

    if (checkTypesError) {
      logger.error('API /certifications: Error fetching check types', checkTypesError);
      return NextResponse.json({ success: false, error: checkTypesError.message }, { status: 500 });
    }

    // Get existing certifications for this pilot using service role (bypasses RLS)
    const { data: pilotChecks, error: checksError } = await getSupabaseAdmin()
      .from('pilot_checks')
      .select('*')
      .eq('pilot_id', pilotId);

    if (checksError) {
      logger.error('API /certifications: Error fetching pilot checks', checksError);
      return NextResponse.json({ success: false, error: checksError.message }, { status: 500 });
    }

    logger.debug('API /certifications: Found check types and existing checks', {
      checkTypesCount: checkTypes?.length || 0,
      existingChecksCount: pilotChecks?.length || 0,
    });

    // Create a map of existing certifications
    const existingChecks = new Map();
    pilotChecks?.forEach((check: any) => {
      existingChecks.set(check.check_type_id, check);
    });

    // Combine all check types with existing certifications
    const result = (checkTypes || []).map((checkType: any) => {
      const existingCheck = existingChecks.get(checkType.id);
      return {
        checkTypeId: checkType.id,
        checkCode: checkType.check_code,
        checkDescription: checkType.check_description,
        category: checkType.category,
        expiryDate: existingCheck?.expiry_date || null,
        status: getCertificationStatus(
          existingCheck?.expiry_date ? new Date(existingCheck.expiry_date) : null
        ),
        hasData: !!existingCheck,
      };
    });

    logger.debug('API /certifications: Returning certification types with status data', {
      count: result.length,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('API /certifications: Fatal error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pilotId = searchParams.get('pilotId');

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { certifications } = body;

    if (!certifications || !Array.isArray(certifications)) {
      return NextResponse.json(
        { success: false, error: 'Certifications data is required and must be an array' },
        { status: 400 }
      );
    }

    logger.debug('API /certifications PUT: Updating certifications', {
      pilotId,
      certificationsCount: certifications.length,
    });

    // Convert the data format expected by the database
    const updates = certifications.map((cert: any) => ({
      pilot_id: pilotId,
      check_type_id: cert.checkTypeId,
      expiry_date: cert.expiryDate || null,
      updated_at: new Date().toISOString(),
    }));

    // Use service role to bypass RLS and perform upsert
    const { error } = await getSupabaseAdmin().from('pilot_checks').upsert(updates, {
      onConflict: 'pilot_id,check_type_id',
    });

    if (error) {
      logger.error('API /certifications PUT: Database error', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Fetch fresh data after upsert to avoid cache issues
    logger.debug('Fetching fresh certification data after update');
    const { data: freshData, error: fetchError } = await getSupabaseAdmin()
      .from('pilot_checks')
      .select()
      .eq('pilot_id', pilotId)
      .in(
        'check_type_id',
        updates.map((u) => u.check_type_id)
      );

    if (fetchError) {
      logger.error('API /certifications PUT: Error fetching updated data', fetchError);
      return NextResponse.json(
        { success: false, error: 'Update succeeded but failed to fetch updated data' },
        { status: 500 }
      );
    }

    logger.info('API /certifications PUT: Successfully updated certification records', {
      count: freshData?.length || 0,
    });

    // Invalidate cache since certification data was updated
    invalidateCache([...CACHE_INVALIDATION_PATTERNS.PILOT_DATA_UPDATED]);
    logger.debug('Cache invalidated for certification data update');

    // Revalidate Next.js cache for pilot pages
    revalidatePath('/dashboard/pilots');
    revalidatePath(`/dashboard/pilots/${pilotId}`);
    revalidatePath(`/dashboard/pilots/${pilotId}/certifications`);
    revalidatePath('/dashboard/certifications');
    logger.debug('Next.js paths revalidated for pilot', { pilotId });

    return NextResponse.json({
      success: true,
      data: freshData,
    });
  } catch (error) {
    logger.error('API /certifications PUT: Fatal error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
