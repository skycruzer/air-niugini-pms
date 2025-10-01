import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    console.log('🔍 API /check-types: Fetching all check types');

    // Get all check types using service role (bypasses RLS)
    const { data: checkTypes, error } = await supabaseAdmin
      .from('check_types')
      .select('*')
      .order('category', { ascending: true })
      .order('check_code', { ascending: true });

    if (error) {
      console.error('🚨 API /check-types: Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('🔍 API /check-types: Found', checkTypes?.length || 0, 'check types');

    return NextResponse.json({
      success: true,
      data: checkTypes || [],
    });
  } catch (error) {
    console.error('🚨 API /check-types: Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
