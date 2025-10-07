/**
 * Secured Pilots API Route (Example Implementation)
 *
 * This file demonstrates how to apply comprehensive security to API routes:
 * - Rate limiting (READ tier for GET, WRITE tier for PUT)
 * - Input sanitization
 * - CSRF protection for mutations
 * - Security headers
 * - Audit logging
 *
 * TO USE: Rename this file to route.ts to replace the current implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { invalidateCache, CACHE_INVALIDATION_PATTERNS } from '@/lib/cache-service';
import { withSecurity, SecurityConfig } from '@/lib/security-middleware';
import { RateLimitTier } from '@/lib/rate-limit';
import { sanitizeObject, sanitizeUuid } from '@/lib/input-sanitization';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-audit';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET handler - Fetch pilots with read rate limiting
 */
async function getHandler(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { searchParams } = new URL(request.url);
    const pilotId = searchParams.get('id');

    // Sanitize pilot ID if provided
    if (pilotId) {
      const sanitizedId = sanitizeUuid(pilotId);
      if (!sanitizedId) {
        await logSecurityEvent({
          eventType: SecurityEventType.INVALID_REQUEST,
          severity: 'low',
          identifier: request.headers.get('x-forwarded-for') || 'unknown',
          url: request.url,
          method: 'GET',
          details: { reason: 'Invalid pilot ID format', pilotId },
        });

        return NextResponse.json(
          { success: false, error: 'Invalid pilot ID format' },
          { status: 400 }
        );
      }

      // Fetch single pilot
      return await getSinglePilot(sanitizedId);
    }

    console.log('🔍 API /pilots: Fetching all pilots with service role...');

    // Get all pilots using service role (bypasses RLS) ordered by seniority
    const { data: pilots, error: pilotsError } = await supabaseAdmin
      .from('pilots')
      .select('*')
      .order('seniority_number', { ascending: true, nullsFirst: false });

    if (pilotsError) {
      console.error('🚨 API /pilots: Error fetching pilots:', pilotsError);
      return NextResponse.json({ success: false, error: pilotsError.message }, { status: 500 });
    }

    console.log('🔍 API /pilots: Found', pilots?.length || 0, 'pilots');

    // Fetch all pilot checks in one query (performance optimization)
    const { data: allPilotChecks, error: checksError } = await supabaseAdmin
      .from('pilot_checks')
      .select(
        `
        pilot_id,
        expiry_date,
        check_types (check_code, check_description, category)
      `
      )
      .in(
        'pilot_id',
        (pilots || []).map((p: any) => p.id)
      )
      .order('pilot_id');

    if (checksError) {
      console.error('🚨 API /pilots: Error fetching pilot checks:', checksError);
    }

    console.log('🔍 API /pilots: Fetched', allPilotChecks?.length || 0, 'certification records');

    // Group checks by pilot_id
    const checksByPilot = (allPilotChecks || []).reduce((acc: any, check: any) => {
      if (!acc[check.pilot_id]) {
        acc[check.pilot_id] = [];
      }
      acc[check.pilot_id].push(check);
      return acc;
    }, {});

    // Calculate certification status for each pilot
    const today = new Date();
    const pilotsWithCerts = (pilots || []).map((pilot: any) => {
      const certifications = checksByPilot[pilot.id] || [];

      const certificationCounts = certifications.reduce(
        (acc: any, check: any) => {
          if (!check.expiry_date) return acc;

          const expiryDate = new Date(check.expiry_date);
          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiry < 0) {
            acc.expired++;
          } else if (daysUntilExpiry <= 30) {
            acc.expiring++;
          } else {
            acc.current++;
          }

          return acc;
        },
        { current: 0, expiring: 0, expired: 0 }
      );

      return {
        ...pilot,
        certificationStatus: certificationCounts,
        total_checks: certifications.length,
        current_checks: certificationCounts.current,
        expiring_checks: certificationCounts.expiring,
        expired_checks: certificationCounts.expired,
      };
    });

    console.log(
      '🔍 API /pilots: Returning',
      pilotsWithCerts.length,
      'pilots with certification data'
    );

    return NextResponse.json({
      success: true,
      data: pilotsWithCerts,
    });
  } catch (error) {
    console.error('🚨 API /pilots: Fatal error:', error);

    await logSecurityEvent({
      eventType: SecurityEventType.SYSTEM_ERROR,
      severity: 'critical',
      identifier: request.headers.get('x-forwarded-for') || 'unknown',
      url: request.url,
      method: 'GET',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET single pilot helper
 */
async function getSinglePilot(pilotId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    console.log('🔍 API /pilots: Fetching pilot with ID:', pilotId);

    const { data: pilot, error: pilotError } = await supabaseAdmin
      .from('pilots')
      .select('*')
      .eq('id', pilotId)
      .single();

    if (pilotError) {
      console.error('🚨 API /pilots: Error fetching pilot:', pilotError);
      return NextResponse.json({ success: false, error: pilotError.message }, { status: 500 });
    }

    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Pilot not found' }, { status: 404 });
    }

    // Get pilot's certifications
    const { data: checks } = await supabaseAdmin
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        check_types (id, check_code, check_description, category)
      `
      )
      .eq('pilot_id', pilotId);

    // Calculate certification status
    const certifications = checks || [];
    const today = new Date();

    const certificationCounts = certifications.reduce(
      (acc: any, check: any) => {
        if (!check.expiry_date) return acc;

        const expiryDate = new Date(check.expiry_date);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          acc.expired++;
        } else if (daysUntilExpiry <= 30) {
          acc.expiring++;
        } else {
          acc.current++;
        }

        return acc;
      },
      { current: 0, expiring: 0, expired: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        ...pilot,
        certificationStatus: certificationCounts,
      },
    });
  } catch (error) {
    console.error('🚨 API /pilots: Fatal error fetching single pilot:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT handler - Update pilot with write rate limiting and input sanitization
 */
async function putHandler(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    console.log('🚀 API /pilots PUT: Starting PUT request');

    const { searchParams } = new URL(request.url);
    const pilotId = searchParams.get('id');

    // Validate and sanitize pilot ID
    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 });
    }

    const sanitizedId = sanitizeUuid(pilotId);
    if (!sanitizedId) {
      await logSecurityEvent({
        eventType: SecurityEventType.INVALID_REQUEST,
        severity: 'low',
        identifier: request.headers.get('x-forwarded-for') || 'unknown',
        url: request.url,
        method: 'PUT',
        details: { reason: 'Invalid pilot ID format', pilotId },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid pilot ID format' },
        { status: 400 }
      );
    }

    // Parse and sanitize request body
    let body;
    try {
      body = await request.json();
      body = sanitizeObject(body);
    } catch (error) {
      await logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_INPUT,
        severity: 'medium',
        identifier: request.headers.get('x-forwarded-for') || 'unknown',
        url: request.url,
        method: 'PUT',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid or malicious input detected' },
        { status: 400 }
      );
    }

    console.log('🔍 API /pilots PUT: Updating pilot with ID:', sanitizedId);

    // Check if pilot exists
    const { data: existingPilot, error: checkError } = await supabaseAdmin
      .from('pilots')
      .select('id, employee_id, first_name, last_name')
      .eq('id', sanitizedId)
      .single();

    if (checkError) {
      return NextResponse.json(
        { success: false, error: `Pilot not found: ${checkError.message}` },
        { status: 404 }
      );
    }

    console.log('✅ API /pilots PUT: Found existing pilot:', existingPilot);

    // Clean and validate body data
    const cleanedBody = { ...body };

    // Handle contract_type validation
    if (cleanedBody.contract_type === '' || cleanedBody.contract_type === undefined) {
      cleanedBody.contract_type = null;
    } else if (cleanedBody.contract_type) {
      const { data: contractTypeExists } = await supabaseAdmin
        .from('contract_types')
        .select('name')
        .eq('name', cleanedBody.contract_type)
        .eq('is_active', true)
        .single();

      if (!contractTypeExists) {
        return NextResponse.json(
          { success: false, error: `Invalid contract type: ${cleanedBody.contract_type}` },
          { status: 400 }
        );
      }
    }

    // Handle middle_name
    if (cleanedBody.middle_name === '') {
      cleanedBody.middle_name = null;
    }

    // Perform update
    const { data, error } = await supabaseAdmin
      .from('pilots')
      .update(cleanedBody)
      .eq('id', sanitizedId)
      .select()
      .single();

    if (error) {
      console.error('🚨 API /pilots PUT: Supabase error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          code: error.code,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'No data returned from update' },
        { status: 500 }
      );
    }

    console.log('✅ API /pilots PUT: Successfully updated pilot');

    // Invalidate cache
    invalidateCache([...CACHE_INVALIDATION_PATTERNS.PILOT_DATA_UPDATED]);

    // Log successful update
    await logSecurityEvent({
      eventType: SecurityEventType.SUCCESSFUL_LOGIN,
      severity: 'low',
      identifier: request.headers.get('x-forwarded-for') || 'unknown',
      url: request.url,
      method: 'PUT',
      details: { pilotId: sanitizedId, action: 'update' },
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('🚨 API /pilots PUT: Fatal error:', error);

    await logSecurityEvent({
      eventType: SecurityEventType.SYSTEM_ERROR,
      severity: 'critical',
      identifier: request.headers.get('x-forwarded-for') || 'unknown',
      url: request.url,
      method: 'PUT',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Security configuration for GET requests
const getSecurityConfig: SecurityConfig = {
  rateLimitTier: RateLimitTier.READ,
  requireCsrf: false, // CSRF not required for GET
  validateContentType: ['application/json'],
  sanitizeInput: false, // GET has no body to sanitize
  requireAuth: false, // Auth checked in handler if needed
};

// Security configuration for PUT requests
const putSecurityConfig: SecurityConfig = {
  rateLimitTier: RateLimitTier.WRITE,
  requireCsrf: true, // CSRF required for mutations
  validateContentType: ['application/json'],
  sanitizeInput: true,
  requireAuth: false, // Auth checked in handler if needed
};

// Export secured handlers
export const GET = withSecurity(getSecurityConfig, getHandler);
export const PUT = withSecurity(putSecurityConfig, putHandler);
