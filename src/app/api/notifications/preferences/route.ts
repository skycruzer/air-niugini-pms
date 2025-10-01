/**
 * Air Niugini B767 Pilot Management System
 * API Route: Notification Preferences
 *
 * GET /api/notifications/preferences - Get user preferences
 * PUT /api/notifications/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET USER PREFERENCES
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get notification preferences
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: {
            user_id: user.id,
            email_enabled: true,
            email_address: user.email,
            certification_expiry_alerts: true,
            certification_expiry_days: 30,
            leave_request_alerts: true,
            leave_approval_alerts: true,
            system_notifications: true,
            daily_digest: false,
            digest_time: '08:00:00',
          },
        });
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('API Error [GET /api/notifications/preferences]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// UPDATE USER PREFERENCES
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Prepare update data
    const updateData: any = {
      user_id: user.id,
    };

    if (body.email_enabled !== undefined) updateData.email_enabled = body.email_enabled;
    if (body.email_address !== undefined) updateData.email_address = body.email_address;
    if (body.certification_expiry_alerts !== undefined)
      updateData.certification_expiry_alerts = body.certification_expiry_alerts;
    if (body.certification_expiry_days !== undefined)
      updateData.certification_expiry_days = body.certification_expiry_days;
    if (body.leave_request_alerts !== undefined)
      updateData.leave_request_alerts = body.leave_request_alerts;
    if (body.leave_approval_alerts !== undefined)
      updateData.leave_approval_alerts = body.leave_approval_alerts;
    if (body.system_notifications !== undefined)
      updateData.system_notifications = body.system_notifications;
    if (body.daily_digest !== undefined) updateData.daily_digest = body.daily_digest;
    if (body.digest_time !== undefined) updateData.digest_time = body.digest_time;

    // Upsert preferences (insert or update)
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert(updateData, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('API Error [PUT /api/notifications/preferences]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
