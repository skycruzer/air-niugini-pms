import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Use Promise.allSettled to handle partial failures gracefully
    const [pilotResult, certificationResult, checkTypesResult, complianceResult] = await Promise.allSettled([
      supabaseAdmin.from('pilots').select('role, captain_qualifications').eq('is_active', true),
      supabaseAdmin.from('pilot_checks').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('check_types').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('pilot_checks').select('expiry_date')
    ])

    // Extract data with fallbacks
    const pilotData = pilotResult.status === 'fulfilled' ? pilotResult.value.data : []
    const certificationCount = certificationResult.status === 'fulfilled' ? certificationResult.value.count : 0
    const checkTypesCount = checkTypesResult.status === 'fulfilled' ? checkTypesResult.value.count : 0
    const complianceData = complianceResult.status === 'fulfilled' ? complianceResult.value.data : []

    // Log any errors but don't fail the entire request
    if (pilotResult.status === 'rejected') {
      console.warn('Error fetching pilot data:', pilotResult.reason)
    }
    if (certificationResult.status === 'rejected') {
      console.warn('Error fetching certification count:', certificationResult.reason)
    }
    if (checkTypesResult.status === 'rejected') {
      console.warn('Error fetching check types count:', checkTypesResult.reason)
    }
    if (complianceResult.status === 'rejected') {
      console.warn('Error fetching compliance data:', complianceResult.reason)
    }

    // Calculate pilots by role and qualifications
    const totalPilots = pilotData?.length || 0
    const captains = pilotData?.filter((p: any) => p.role === 'Captain').length || 0
    const firstOfficers = pilotData?.filter((p: any) => p.role === 'First Officer').length || 0

    // Count specialized qualifications
    const trainingCaptains = pilotData?.filter((p: any) =>
      p.captain_qualifications && Array.isArray(p.captain_qualifications) &&
      p.captain_qualifications.includes('training_captain')
    ).length || 0

    const examiners = pilotData?.filter((p: any) =>
      p.captain_qualifications && Array.isArray(p.captain_qualifications) &&
      p.captain_qualifications.includes('examiner')
    ).length || 0

    // Calculate compliance (certifications that are current)
    const currentDate = new Date()
    const totalCerts = complianceData?.length || 0
    const currentCerts = complianceData?.filter((cert: any) => {
      if (!cert.expiry_date) return false
      const expiryDate = new Date(cert.expiry_date)
      return expiryDate > currentDate
    }).length || 0

    const compliance = totalCerts > 0 ? Math.round((currentCerts / totalCerts) * 100) : 0

    const stats = {
      totalPilots,
      captains,
      firstOfficers,
      trainingCaptains,
      examiners,
      certifications: certificationCount || 0,
      checkTypes: checkTypesCount || 0,
      compliance
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      {
        totalPilots: 0,
        captains: 0,
        firstOfficers: 0,
        trainingCaptains: 0,
        examiners: 0,
        certifications: 0,
        checkTypes: 0,
        compliance: 0
      },
      { status: 500 }
    )
  }
}