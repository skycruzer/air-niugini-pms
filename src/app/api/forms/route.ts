/**
 * @fileoverview Digital Forms API Route
 * Handles form submissions and approvals
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDigitalForms,
  getDigitalFormById,
  getFormSubmissions,
  createFormSubmission,
  updateFormSubmissionStatus,
} from '@/lib/document-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // Get single form by ID
    if (action === 'get_form' && id) {
      const form = await getDigitalFormById(id);
      return NextResponse.json({ success: true, data: form });
    }

    // Get all forms
    if (action === 'list' || action === 'list_forms') {
      const forms = await getDigitalForms();
      return NextResponse.json({ success: true, data: forms });
    }

    // Get form submissions with filters
    const filters = {
      form_id: searchParams.get('form_id') || undefined,
      submitted_by: searchParams.get('submitted_by') || undefined,
      pilot_id: searchParams.get('pilot_id') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const submissions = await getFormSubmissions(filters);
    return NextResponse.json({ success: true, data: submissions });
  } catch (error: any) {
    console.error('[API] Error in GET /api/forms:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Approve/Reject submission
    if (action === 'update_status') {
      const { id, status, approved_by, rejection_reason } = data;

      if (!id || !status || !approved_by) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const submission = await updateFormSubmissionStatus(
        id,
        status,
        approved_by,
        rejection_reason
      );
      return NextResponse.json({ success: true, data: submission });
    }

    // Check if this is a Leave Request Form BEFORE creating submission
    const { getSupabaseAdmin } = await import('@/lib/supabase');
    const supabase = getSupabaseAdmin();

    // Get the form details to check if it's a leave request form
    const { data: form } = await supabase
      .from('digital_forms')
      .select('form_type')
      .eq('id', data.form_id)
      .single();

    // If this is a Leave Request Form, create ONLY in leave_requests table (NOT in form_submissions)
    if (form?.form_type === 'leave_request' && data.form_data && data.pilot_id) {
      // Extract leave request data
      const formData = data.form_data;

      // Map form leave types to system leave types
      const leaveTypeMapping: Record<string, string> = {
        RDO: 'RDO',
        WDO: 'SDO',
        'Annual Leave': 'ANNUAL',
        'Sick Leave': 'SICK',
        'Compassionate Leave': 'COMPASSIONATE',
        'Training Leave': 'ANNUAL',
      };

      const requestType = leaveTypeMapping[formData.leave_type] || 'RDO';

      // Calculate days count
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Create the leave request in leave_requests table
      const { data: leaveRequest, error: leaveError } = await supabase
        .from('leave_requests')
        .insert({
          pilot_id: data.pilot_id,
          request_type: requestType,
          roster_period: formData.roster_period || '',
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_count: daysCount,
          status: 'PENDING',
          reason: formData.reason || '',
          request_method: 'SYSTEM',
          request_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (leaveError) {
        throw new Error(`Failed to create leave request: ${leaveError.message}`);
      }

      console.log('[API] Created leave request from Leave Request Form:', {
        pilot_id: data.pilot_id,
        request_type: requestType,
        dates: `${formData.start_date} to ${formData.end_date}`,
      });

      // Return the leave request (NOT a form submission)
      return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
    }

    // For all OTHER forms (not Leave Request Forms), create in form_submissions table
    const submission = await createFormSubmission(data);

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error in POST /api/forms:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create submission' },
      { status: 500 }
    );
  }
}
