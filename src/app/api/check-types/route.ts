import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    logger.debug(' API /check-types: Fetching all check types');

    // Get all check types using service role (bypasses RLS)
    const { data: checkTypes, error } = await supabaseAdmin
      .from('check_types')
      .select('*')
      .order('category', { ascending: true })
      .order('check_code', { ascending: true });

    if (error) {
      logger.error(' API /check-types: Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    logger.debug(' API /check-types: Found', checkTypes?.length || 0, 'check types');

    return NextResponse.json({
      success: true,
      data: checkTypes || [],
    });
  } catch (error) {
    logger.error(' API /check-types: Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
