import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCertificationStatus } from '@/lib/certification-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pilotId = searchParams.get('pilotId')

    if (!pilotId) {
      return NextResponse.json(
        { success: false, error: 'Pilot ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 API /certifications: Fetching certifications for pilot:', pilotId)

    // Get all check types using service role (bypasses RLS)
    const { data: checkTypes, error: checkTypesError } = await getSupabaseAdmin()
      .from('check_types')
      .select('*')
      .order('category', { ascending: true })
      .order('check_code', { ascending: true })

    if (checkTypesError) {
      console.error('🚨 API /certifications: Error fetching check types:', checkTypesError)
      return NextResponse.json(
        { success: false, error: checkTypesError.message },
        { status: 500 }
      )
    }

    // Get existing certifications for this pilot using service role (bypasses RLS)
    const { data: pilotChecks, error: checksError } = await getSupabaseAdmin()
      .from('pilot_checks')
      .select('*')
      .eq('pilot_id', pilotId)

    if (checksError) {
      console.error('🚨 API /certifications: Error fetching pilot checks:', checksError)
      return NextResponse.json(
        { success: false, error: checksError.message },
        { status: 500 }
      )
    }

    console.log('🔍 API /certifications: Found', checkTypes?.length || 0, 'check types and', pilotChecks?.length || 0, 'existing checks')

    // Create a map of existing certifications
    const existingChecks = new Map()
    pilotChecks?.forEach((check: any) => {
      existingChecks.set(check.check_type_id, check)
    })

    // Combine all check types with existing certifications
    const result = (checkTypes || []).map((checkType: any) => {
      const existingCheck = existingChecks.get(checkType.id)
      return {
        checkTypeId: checkType.id,
        checkCode: checkType.check_code,
        checkDescription: checkType.check_description,
        category: checkType.category,
        expiryDate: existingCheck?.expiry_date || null,
        status: getCertificationStatus(existingCheck?.expiry_date ? new Date(existingCheck.expiry_date) : null),
        hasData: !!existingCheck
      }
    })

    console.log('🔍 API /certifications: Returning', result.length, 'certification types with status data')

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('🚨 API /certifications: Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pilotId = searchParams.get('pilotId')

    if (!pilotId) {
      return NextResponse.json(
        { success: false, error: 'Pilot ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { certifications } = body

    if (!certifications || !Array.isArray(certifications)) {
      return NextResponse.json(
        { success: false, error: 'Certifications data is required and must be an array' },
        { status: 400 }
      )
    }

    console.log('🔍 API /certifications PUT: Updating certifications for pilot:', pilotId)
    console.log('🔍 API /certifications PUT: Certifications to update:', certifications.length)

    // Convert the data format expected by the database
    const updates = certifications.map((cert: any) => ({
      pilot_id: pilotId,
      check_type_id: cert.checkTypeId,
      expiry_date: cert.expiryDate || null,
      updated_at: new Date().toISOString()
    }))

    // Use service role to bypass RLS and perform upsert
    const { data, error } = await getSupabaseAdmin()
      .from('pilot_checks')
      .upsert(updates, {
        onConflict: 'pilot_id,check_type_id'
      })
      .select()

    if (error) {
      console.error('🚨 API /certifications PUT: Database error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('🔍 API /certifications PUT: Successfully updated', data?.length || 0, 'certification records')

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('🚨 API /certifications PUT: Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}