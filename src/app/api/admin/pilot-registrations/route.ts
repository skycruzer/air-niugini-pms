/**
 * Admin Pilot Registrations API
 * GET /api/admin/pilot-registrations - Get all pending registrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPendingRegistrations } from '@/lib/pilot-registration-service';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * GET - Get all pending pilot registrations
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies for server-side auth
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    );

    // Get authenticated user from cookies
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('an_users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      console.error('Admin check error:', adminError, adminUser);
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin access required',
        },
        { status: 403 }
      );
    }

    // Get pending registrations
    const registrations = await getPendingRegistrations();

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
