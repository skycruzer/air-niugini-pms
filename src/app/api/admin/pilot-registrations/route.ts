/**
 * Admin Pilot Registrations API
 * GET /api/admin/pilot-registrations - Get all pending registrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPendingRegistrations } from '@/lib/pilot-registration-service';
import { supabase } from '@/lib/supabase';

/**
 * GET - Get all pending pilot registrations
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated admin user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
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
