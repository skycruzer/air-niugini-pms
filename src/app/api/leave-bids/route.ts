import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/leave-bids
 * Create a new leave bid submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pilot_id,
      roster_period_code,
      preferred_dates,
      alternative_dates,
      priority,
      reason,
      notes,
    } = body;

    // Validate required fields
    if (!pilot_id || !roster_period_code || !preferred_dates || !priority || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: pilot_id, roster_period_code, preferred_dates, priority, reason',
        },
        { status: 400 }
      );
    }

    // Validate priority value
    if (!['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid priority value. Must be HIGH, MEDIUM, or LOW',
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify pilot exists
    const { data: pilot, error: pilotError } = await supabaseAdmin
      .from('pilots')
      .select('id, first_name, last_name')
      .eq('id', pilot_id)
      .single();

    if (pilotError || !pilot) {
      console.error('[ERROR] Pilot not found:', pilotError);
      return NextResponse.json(
        {
          success: false,
          error: 'Pilot not found',
        },
        { status: 404 }
      );
    }

    // Insert leave bid
    const { data: leaveBid, error: insertError } = await supabaseAdmin
      .from('leave_bids')
      .insert({
        pilot_id,
        roster_period_code,
        preferred_dates,
        alternative_dates: alternative_dates || null,
        priority,
        reason,
        notes: notes || null,
        status: 'PENDING',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ERROR] Failed to insert leave bid:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create leave bid',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    console.log('[SUCCESS] Leave bid created:', {
      id: leaveBid.id,
      pilot: `${pilot.first_name} ${pilot.last_name}`,
      roster_period: roster_period_code,
      priority,
    });

    return NextResponse.json({
      success: true,
      data: leaveBid,
      message: 'Leave bid submitted successfully',
    });
  } catch (error) {
    console.error('[ERROR] Leave bid API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leave-bids
 * Fetch leave bids with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pilotId = searchParams.get('pilotId');
    const rosterPeriod = searchParams.get('rosterPeriod');
    const status = searchParams.get('status');

    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('leave_bids')
      .select(`
        *,
        pilots!inner (
          id,
          first_name,
          last_name,
          employee_id,
          role,
          seniority_number
        ),
        an_users!leave_bids_reviewed_by_fkey (
          id,
          name,
          email
        )
      `)
      .order('submitted_at', { ascending: false });

    // Apply filters
    if (pilotId) {
      query = query.eq('pilot_id', pilotId);
    }

    if (rosterPeriod) {
      query = query.eq('roster_period_code', rosterPeriod);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: leaveBids, error } = await query;

    if (error) {
      console.error('[ERROR] Failed to fetch leave bids:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch leave bids',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('[INFO] Leave bids fetched:', {
      count: leaveBids?.length || 0,
      filters: { pilotId, rosterPeriod, status },
    });

    return NextResponse.json({
      success: true,
      data: leaveBids || [],
      count: leaveBids?.length || 0,
    });
  } catch (error) {
    console.error('[ERROR] Leave bids GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/leave-bids
 * Update leave bid status (approve/reject)
 * Requires admin or manager role
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, review_comments, reviewed_by } = body;

    // Validate required fields
    if (!id || !status || !reviewed_by) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: id, status, reviewed_by',
        },
        { status: 400 }
      );
    }

    // Validate status value
    if (!['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status value. Must be PENDING, APPROVED, REJECTED, or WITHDRAWN',
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update leave bid
    const { data: updatedBid, error: updateError } = await supabaseAdmin
      .from('leave_bids')
      .update({
        status,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        review_comments: review_comments || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        pilots!inner (first_name, last_name)
      `)
      .single();

    if (updateError) {
      console.error('[ERROR] Failed to update leave bid:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update leave bid',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log('[SUCCESS] Leave bid updated:', {
      id,
      status,
      pilot: `${updatedBid.pilots.first_name} ${updatedBid.pilots.last_name}`,
    });

    return NextResponse.json({
      success: true,
      data: updatedBid,
      message: `Leave bid ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('[ERROR] Leave bid PATCH API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
