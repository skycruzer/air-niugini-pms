/**
 * Admin Pilot Registrations API
 * GET /api/admin/pilot-registrations - Get all pending registrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPendingRegistrations } from '@/lib/pilot-registration-service';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET - Get all pending pilot registrations
 */
export async function GET(request: NextRequest) {
  try {
    // Use admin client to bypass RLS - this is safe because we verify admin role below
    const supabaseAdmin = getSupabaseAdmin();

    // Get session from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try to get session from cookie as fallback
      const cookieHeader = request.headers.get('cookie');
      if (!cookieHeader) {
        console.error('[Admin API] No auth header or cookie found');
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized - No session found',
          },
          { status: 401 }
        );
      }

      // Parse session from cookie
      const sessionMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
      if (!sessionMatch) {
        console.error('[Admin API] No session token in cookie');
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized - Invalid session',
          },
          { status: 401 }
        );
      }

      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]));
        const userEmail = sessionData?.user?.email;

        if (!userEmail) {
          console.error('[Admin API] No email in session');
          return NextResponse.json(
            {
              success: false,
              error: 'Unauthorized - No user email',
            },
            { status: 401 }
          );
        }

        // Verify admin role using admin client
        const { data: adminUser, error: adminError } = await supabaseAdmin
          .from('an_users')
          .select('role')
          .eq('email', userEmail)
          .single();

        if (adminError || !adminUser || adminUser.role !== 'admin') {
          console.error('[Admin API] Admin check failed:', adminError, adminUser);
          return NextResponse.json(
            {
              success: false,
              error: 'Forbidden - Admin access required',
            },
            { status: 403 }
          );
        }

        // eslint-disable-next-line no-console
        console.log('[Admin API] Admin verified:', userEmail);
      } catch (parseError) {
        console.error('[Admin API] Failed to parse session:', parseError);
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized - Invalid session format',
          },
          { status: 401 }
        );
      }
    }

    // Get pending registrations using admin client
    const registrations = await getPendingRegistrations();

    // eslint-disable-next-line no-console
    console.log('[Admin API] Returning registrations:', registrations.length);
    return NextResponse.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error('GET /api/admin/pilot-registrations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch registrations',
      },
      { status: 500 }
    );
  }
}
