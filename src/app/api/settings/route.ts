import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('🔧 Settings API: Fetching all settings...');

    const { data, error } = await supabaseAdmin.from('settings').select('*').order('key');

    if (error) {
      console.error('❌ Settings API: Error fetching settings:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ Settings API: Found', data?.length || 0, 'settings');

    // Transform flat settings array into structured data
    const settingsMap =
      data?.reduce(
        (acc: Record<string, any>, setting: any) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, any>
      ) || {};

    const structuredData = {
      app_title: settingsMap.app_title || 'Air Niugini Pilot Management System',
      alert_thresholds: settingsMap.alert_thresholds || {
        critical_days: 7,
        urgent_days: 14,
        warning_30_days: 30,
        warning_60_days: 60,
        early_warning_90_days: 90,
      },
      pilot_requirements: settingsMap.pilot_requirements || {
        pilot_retirement_age: 65,
        number_of_aircraft: 2,
        captains_per_hull: 7,
        first_officers_per_hull: 7,
        minimum_captains_per_hull: 10,
        minimum_first_officers_per_hull: 10,
        training_captains_per_pilots: 11,
        examiners_per_pilots: 11,
      },
    };

    return NextResponse.json({
      success: true,
      data: structuredData,
    });
  } catch (error) {
    console.error('❌ Settings API: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Setting key is required' },
        { status: 400 }
      );
    }

    console.log('🔧 Settings API: Updating setting:', key);

    // Upsert the setting
    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      )
      .select();

    if (error) {
      console.error('❌ Settings API: Error updating setting:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ Settings API: Updated setting successfully');

    return NextResponse.json({
      success: true,
      data: data?.[0],
    });
  } catch (error) {
    console.error('❌ Settings API: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
