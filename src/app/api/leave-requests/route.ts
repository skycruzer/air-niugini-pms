import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRosterPeriodFromDate } from '@/lib/roster-utils'
import { differenceInDays } from 'date-fns'

export async function GET() {
  try {
    console.log('🔍 API /leave-requests: Fetching leave requests with service role...')

    // Get leave requests with pilot information using service role with retry logic
    let requests = null
    let error = null

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await supabaseAdmin
          .from('leave_requests')
          .select('*')
          .order('created_at', { ascending: false })

        requests = result.data
        error = result.error
        console.log('🔍 API /leave-requests: Raw result count:', result.data?.length || 0)
        console.log('🔍 API /leave-requests: Raw result IDs:', result.data?.map((r: any) => r.id) || [])
        if (result.error) {
          console.error('🚨 API /leave-requests: Query error:', result.error)
        }
        break // Success, exit retry loop
      } catch (fetchError) {
        console.warn(`🚨 API /leave-requests: Attempt ${attempt} failed:`, fetchError)
        error = fetchError
        if (attempt === 2) {
          console.error('🚨 API /leave-requests: Error fetching leave requests:', {
            message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
            details: fetchError instanceof Error ? fetchError.stack : String(fetchError),
            hint: '',
            code: ''
          })
        }
      }
    }

    if (error) {
      console.error('🚨 API /leave-requests: Final error after retries:', error)
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to fetch leave requests' },
        { status: 500 }
      )
    }

    // Get pilot information for each request
    const transformedRequests = []
    for (const request of requests || []) {
      try {
        const { data: pilot } = await supabaseAdmin
          .from('pilots')
          .select('first_name, middle_name, last_name, employee_id')
          .eq('id', request.pilot_id)
          .single()

        transformedRequests.push({
          ...request,
          pilot_name: pilot
            ? `${pilot.first_name} ${pilot.middle_name ? pilot.middle_name + ' ' : ''}${pilot.last_name}`
            : 'Unknown Pilot',
          employee_id: pilot?.employee_id || 'N/A',
          reviewer_name: null // We'll get this separately if needed
        })
      } catch (pilotError) {
        console.warn(`Could not fetch pilot for request ${request.id}:`, pilotError)
        transformedRequests.push({
          ...request,
          pilot_name: 'Unknown Pilot',
          employee_id: 'N/A',
          reviewer_name: null
        })
      }
    }

    console.log('🔍 API /leave-requests: Found', transformedRequests.length, 'leave requests')
    console.log('🔍 API /leave-requests: Sample request:', JSON.stringify(transformedRequests[0], null, 2))

    return NextResponse.json({
      success: true,
      data: transformedRequests
    })
  } catch (error) {
    console.error('🚨 API /leave-requests: Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    console.log('📝 API /leave-requests: Creating new leave request...', requestData)

    // Calculate roster period and days
    const startDateRoster = getRosterPeriodFromDate(new Date(requestData.start_date))
    const daysCount = differenceInDays(new Date(requestData.end_date), new Date(requestData.start_date)) + 1

    // Create the leave request
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert([{
        pilot_id: requestData.pilot_id,
        request_type: requestData.request_type,
        roster_period: startDateRoster.code,
        start_date: requestData.start_date,
        end_date: requestData.end_date,
        days_count: daysCount,
        reason: requestData.reason,
        request_date: requestData.request_date,
        request_method: requestData.request_method,
        is_late_request: requestData.is_late_request || false,
        status: 'PENDING'
      }])
      .select('*')
      .single()

    if (error) {
      console.error('🚨 API /leave-requests: Error creating request:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Get pilot information for the created request
    const { data: pilot } = await supabaseAdmin
      .from('pilots')
      .select('first_name, middle_name, last_name, employee_id')
      .eq('id', data.pilot_id)
      .single()

    const responseData = {
      ...data,
      pilot_name: pilot
        ? `${pilot.first_name} ${pilot.middle_name ? pilot.middle_name + ' ' : ''}${pilot.last_name}`
        : 'Unknown Pilot',
      employee_id: pilot?.employee_id || 'N/A',
      reviewer_name: null
    }

    console.log('✅ API /leave-requests: Created leave request:', responseData.id)

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('🚨 API /leave-requests: Fatal error creating request:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}