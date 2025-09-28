import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCertificationStatus } from '@/lib/certification-utils'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { searchParams } = new URL(request.url)
    const daysAhead = parseInt(searchParams.get('daysAhead') || '60')

    console.log('🔍 API /expiring-certifications: Fetching certifications expiring in next', daysAhead, 'days')

    // Calculate date threshold
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    // Get expiring certifications using a direct query instead of the view
    // Join pilots, pilot_checks, and check_types tables
    const { data: expiringChecks, error } = await supabaseAdmin
      .from('pilot_checks')
      .select(`
        expiry_date,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id
        ),
        check_types (
          check_code,
          check_description,
          category
        )
      `)
      .not('expiry_date', 'is', null)
      .gte('expiry_date', today.toISOString().split('T')[0])
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })

    if (error) {
      console.error('🚨 API /expiring-certifications: Database error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const result = (expiringChecks || []).map((check: any) => ({
      pilotName: `${check.pilots?.first_name || ''} ${check.pilots?.middle_name ? check.pilots.middle_name + ' ' : ''}${check.pilots?.last_name || ''}`.trim(),
      employeeId: check.pilots?.employee_id || '',
      checkCode: check.check_types?.check_code || '',
      checkDescription: check.check_types?.check_description || '',
      category: check.check_types?.category || '',
      expiryDate: new Date(check.expiry_date),
      status: getCertificationStatus(new Date(check.expiry_date))
    }))

    console.log('🔍 API /expiring-certifications: Found', result.length, 'expiring certifications')

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('🚨 API /expiring-certifications: Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}