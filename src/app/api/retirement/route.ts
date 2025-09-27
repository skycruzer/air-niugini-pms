import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getPilotsNearingRetirementForDashboard } from '@/lib/pilot-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Retirement API: Starting request...')

    // Get pilots nearing retirement
    const nearingRetirement = await getPilotsNearingRetirementForDashboard()

    console.log('🔍 Retirement API: Found', nearingRetirement.length, 'pilots nearing retirement')

    // Count pilots by status
    let dueSoon = 0
    let overdue = 0

    nearingRetirement.forEach(pilot => {
      if (pilot.retirement) {
        switch (pilot.retirement.retirementStatus) {
          case 'due_soon':
            dueSoon++
            break
          case 'overdue':
            overdue++
            break
        }
      }
    })

    const retirementData = {
      nearingRetirement: nearingRetirement.length,
      dueSoon,
      overdue,
      pilots: nearingRetirement.map(pilot => ({
        id: pilot.id,
        name: `${pilot.first_name} ${pilot.last_name}`,
        retirement: pilot.retirement
      }))
    }

    console.log('🔍 Retirement API: Successfully calculated retirement metrics')

    return NextResponse.json({
      success: true,
      data: retirementData
    })
  } catch (error) {
    console.error('🚨 Retirement API: Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch retirement data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}