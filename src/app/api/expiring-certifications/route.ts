import { NextRequest, NextResponse } from 'next/server'
import { getExpiringCertifications } from '@/lib/expiring-certifications-service'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysAhead = parseInt(searchParams.get('daysAhead') || '60')

    console.log('🔍 API /expiring-certifications: Fetching certifications expiring in next', daysAhead, 'days')

    // Use the service function to get expiring certifications
    const result = await getExpiringCertifications(daysAhead)

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