import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getSinglePilot(pilotId: string) {
  try {
    console.log('🔍 API /pilots: Fetching pilot with ID:', pilotId)

    // Get single pilot using service role (bypasses RLS)
    const { data: pilot, error: pilotError } = await supabaseAdmin
      .from('pilots')
      .select('*')
      .eq('id', pilotId)
      .single()

    if (pilotError) {
      console.error('🚨 API /pilots: Error fetching pilot:', pilotError)
      return NextResponse.json(
        { success: false, error: pilotError.message },
        { status: 500 }
      )
    }

    if (!pilot) {
      return NextResponse.json(
        { success: false, error: 'Pilot not found' },
        { status: 404 }
      )
    }

    // Get pilot's certifications with retry logic
    let checks = null
    let checksError = null

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await supabaseAdmin
          .from('pilot_checks')
          .select(`
            id,
            expiry_date,
            check_types (
              id,
              check_code,
              check_description,
              category
            )
          `)
          .eq('pilot_id', pilotId)

        checks = result.data
        checksError = result.error
        break // Success, exit retry loop
      } catch (error) {
        console.warn(`🚨 API /pilots: Attempt ${attempt} failed for single pilot ${pilotId}:`, error)
        checksError = error
        if (attempt === 2) {
          console.error(`🚨 API /pilots: Error fetching checks for pilot ${pilotId}:`, {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error.stack : String(error),
            hint: '',
            code: ''
          })
        }
      }
    }

    // Calculate certification status
    const certifications = checks || []
    const today = new Date()

    const certificationCounts = certifications.reduce(
      (acc: any, check: any) => {
        if (!check.expiry_date) {
          return acc // Skip checks without expiry dates
        }

        const expiryDate = new Date(check.expiry_date)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) {
          acc.expired++
        } else if (daysUntilExpiry <= 30) {
          acc.expiring++
        } else {
          acc.current++
        }

        return acc
      },
      { current: 0, expiring: 0, expired: 0 }
    )

    const result = {
      ...pilot,
      certificationStatus: certificationCounts
    }

    console.log('🔍 API /pilots: Returning single pilot data')

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('🚨 API /pilots: Fatal error fetching single pilot:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 API /pilots PUT: Starting PUT request')

    const { searchParams } = new URL(request.url)
    const pilotId = searchParams.get('id')

    console.log('🔍 API /pilots PUT: Request URL:', request.url)
    console.log('🔍 API /pilots PUT: Pilot ID from params:', pilotId)

    if (!pilotId) {
      console.log('❌ API /pilots PUT: No pilot ID provided')
      return NextResponse.json(
        { success: false, error: 'Pilot ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('🔍 API /pilots PUT: Updating pilot with ID:', pilotId)
    console.log('🔍 API /pilots PUT: Request body:', JSON.stringify(body, null, 2))
    console.log('🔍 API /pilots PUT: Body keys:', Object.keys(body))

    // First check if pilot exists
    const { data: existingPilot, error: checkError } = await supabaseAdmin
      .from('pilots')
      .select('id, employee_id, first_name, last_name')
      .eq('id', pilotId)
      .single()

    if (checkError) {
      console.error('🚨 API /pilots PUT: Error checking existing pilot:', checkError)
      return NextResponse.json(
        { success: false, error: `Pilot not found: ${checkError.message}` },
        { status: 404 }
      )
    }

    console.log('✅ API /pilots PUT: Found existing pilot:', existingPilot)

    // Clean and validate the body data
    const cleanedBody = { ...body }

    // Handle contract_type: validate against existing contract types or set to null
    if (cleanedBody.contract_type === '' || cleanedBody.contract_type === undefined) {
      cleanedBody.contract_type = null
    } else if (cleanedBody.contract_type) {
      // Validate contract type exists in database
      const { data: contractTypeExists } = await supabaseAdmin
        .from('contract_types')
        .select('name')
        .eq('name', cleanedBody.contract_type)
        .eq('is_active', true)
        .single()

      if (!contractTypeExists) {
        console.log('🚨 API /pilots PUT: Invalid contract type:', cleanedBody.contract_type)
        return NextResponse.json(
          { success: false, error: `Invalid contract type: ${cleanedBody.contract_type}. Valid types are: Fulltime, Commuting, Tours` },
          { status: 400 }
        )
      }
    }

    // Handle middle_name: convert empty string to null
    if (cleanedBody.middle_name === '') {
      cleanedBody.middle_name = null
    }

    console.log('🔧 API /pilots PUT: Cleaned body for update:', JSON.stringify(cleanedBody, null, 2))

    // Use service role client to bypass RLS
    console.log('🔧 API /pilots PUT: Performing update...')
    const { data, error } = await supabaseAdmin
      .from('pilots')
      .update(cleanedBody)
      .eq('id', pilotId)
      .select()
      .single()

    if (error) {
      console.error('🚨 API /pilots PUT: Supabase error details:', error)
      console.error('🚨 API /pilots PUT: Error code:', error.code)
      console.error('🚨 API /pilots PUT: Error message:', error.message)
      console.error('🚨 API /pilots PUT: Error details:', error.details)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      console.error('🚨 API /pilots PUT: No data returned from update')
      return NextResponse.json(
        { success: false, error: 'No data returned from update' },
        { status: 500 }
      )
    }

    console.log('✅ API /pilots PUT: Successfully updated pilot')
    console.log('✅ API /pilots PUT: Updated data:', JSON.stringify(data, null, 2))
    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('🚨 API /pilots PUT: Fatal error:', error)
    console.error('🚨 API /pilots PUT: Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pilotId = searchParams.get('id')

    if (pilotId) {
      console.log('🔍 API /pilots: Fetching single pilot with ID:', pilotId)
      return await getSinglePilot(pilotId)
    }

    console.log('🔍 API /pilots: Fetching all pilots with service role...')

    // Get all pilots using service role (bypasses RLS) ordered by seniority
    const { data: pilots, error: pilotsError } = await supabaseAdmin
      .from('pilots')
      .select('*')
      .order('seniority_number', { ascending: true, nullsFirst: false })

    if (pilotsError) {
      console.error('🚨 API /pilots: Error fetching pilots:', pilotsError)
      return NextResponse.json(
        { success: false, error: pilotsError.message },
        { status: 500 }
      )
    }

    console.log('🔍 API /pilots: Found', pilots?.length || 0, 'pilots')

    // Get certification counts for each pilot with retry logic
    const pilotsWithCerts = await Promise.all(
      (pilots || []).map(async (pilot: any) => {
        let checks = null
        let checksError = null

        // Retry logic for flaky network connections
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const result = await supabaseAdmin
              .from('pilot_checks')
              .select(`
                expiry_date,
                check_types (check_code, check_description, category)
              `)
              .eq('pilot_id', pilot.id)

            checks = result.data
            checksError = result.error
            break // Success, exit retry loop
          } catch (error) {
            console.warn(`🚨 API /pilots: Attempt ${attempt} failed for pilot ${pilot.id}:`, error)
            checksError = error
            if (attempt === 2) {
              // Final attempt failed, log the error
              console.error(`🚨 API /pilots: Error fetching checks for pilot ${pilot.id}:`, {
                message: error instanceof Error ? error.message : 'Unknown error',
                details: error instanceof Error ? error.stack : String(error),
                hint: '',
                code: ''
              })
            }
          }
        }

        // Calculate certification status
        const certifications = checks || []
        const today = new Date()

        const certificationCounts = certifications.reduce(
          (acc: any, check: any) => {
            if (!check.expiry_date) {
              return acc // Skip checks without expiry dates
            }

            const expiryDate = new Date(check.expiry_date)
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntilExpiry < 0) {
              acc.expired++
            } else if (daysUntilExpiry <= 30) {
              acc.expiring++
            } else {
              acc.current++
            }

            return acc
          },
          { current: 0, expiring: 0, expired: 0 }
        )

        return {
          ...pilot,
          certificationStatus: certificationCounts
        }
      })
    )

    console.log('🔍 API /pilots: Returning', pilotsWithCerts.length, 'pilots with certification data')

    return NextResponse.json({
      success: true,
      data: pilotsWithCerts
    })
  } catch (error) {
    console.error('🚨 API /pilots: Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}