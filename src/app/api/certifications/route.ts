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

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
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

    logger.info('API /certifications PUT: Starting update process', {
      pilotId,
      certificationsCount: certifications.length,
      timestamp: new Date().toISOString(),
    });

    // Convert the data format expected by the database
    const updates = certifications.map((cert: any) => ({
      pilot_id: pilotId,
      check_type_id: cert.checkTypeId,
      expiry_date: cert.expiryDate || null,
      updated_at: new Date().toISOString(),
    }));

    // Log the exact data being sent to database
    logger.info('API /certifications PUT: Prepared upsert data', {
      updateCount: updates.length,
      sampleUpdate: updates[0], // Log first update as sample
      allCheckTypeIds: updates.map((u) => u.check_type_id),
    });

    // Use service role to bypass RLS and perform upsert
    logger.info('API /certifications PUT: Executing upsert operation...');
    const { data: upsertData, error, status, statusText } = await getSupabaseAdmin()
      .from('pilot_checks')
      .upsert(updates, {
        onConflict: 'pilot_id,check_type_id',
      })
      .select(); // CRITICAL: Add .select() to get the upserted data back

    // Log complete upsert result
    logger.info('API /certifications PUT: Upsert operation completed', {
      hasError: !!error,
      hasData: !!upsertData,
      dataCount: upsertData?.length || 0,
      status,
      statusText,
    });

    if (error) {
      logger.error('API /certifications PUT: Database error', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Log if upsert succeeded but returned no data
    if (!upsertData || upsertData.length === 0) {
      logger.warn('API /certifications PUT: Upsert succeeded but returned no data', {
        expectedCount: updates.length,
      });
    }

    // Fetch fresh data after upsert to verify database persistence
    logger.info('API /certifications PUT: Fetching fresh data to verify database update');
    const { data: freshData, error: fetchError } = await getSupabaseAdmin()
      .from('pilot_checks')
      .select()
      .eq('pilot_id', pilotId)
      .in(
        'check_type_id',
        updates.map((u) => u.check_type_id)
      );

    if (fetchError) {
      logger.error('API /certifications PUT: Error fetching updated data', {
        fetchError,
        errorMessage: fetchError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Update succeeded but failed to fetch updated data' },
        { status: 500 }
      );
    }

    // Compare fresh data with what we sent
    logger.info('API /certifications PUT: Verification query completed', {
      sentCount: updates.length,
      retrievedCount: freshData?.length || 0,
      sampleRetrieved: freshData?.[0], // Log first retrieved record
    });

    // Check if data actually persisted
    if (freshData && freshData.length > 0) {
      const comparisonResults = updates.map((update) => {
        const retrieved = freshData.find((f: any) => f.check_type_id === update.check_type_id);
        return {
          checkTypeId: update.check_type_id,
          sentExpiryDate: update.expiry_date,
          retrievedExpiryDate: retrieved?.expiry_date,
          matched: update.expiry_date === retrieved?.expiry_date,
        };
      });

      const mismatchCount = comparisonResults.filter((r) => !r.matched).length;

      logger.info('API /certifications PUT: Data verification results', {
        totalChecked: comparisonResults.length,
        matched: comparisonResults.length - mismatchCount,
        mismatched: mismatchCount,
        sampleComparison: comparisonResults[0],
      });

      if (mismatchCount > 0) {
        logger.error('API /certifications PUT: DATA PERSISTENCE FAILURE DETECTED', {
          mismatches: comparisonResults.filter((r) => !r.matched),
        });
      }
    } else {
      logger.error('API /certifications PUT: CRITICAL - No data retrieved after update', {
        expectedCount: updates.length,
      });
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

    const response = NextResponse.json({
      success: true,
      data: freshData,
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    logger.error('API /certifications PUT: Fatal error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
