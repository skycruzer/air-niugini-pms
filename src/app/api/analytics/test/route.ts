/**
 * @fileoverview Analytics Test API Route
 * Test endpoint for analytics functionality
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { NextResponse } from 'next/server'
import {
  getPilotAnalytics,
  getCertificationAnalytics,
  getLeaveAnalytics,
  getFleetAnalytics,
  getTrendAnalytics,
  getRiskAnalytics
} from '@/lib/analytics-service'

/**
 * GET /api/analytics/test
 * Test endpoint to verify analytics services are working
 */
export async function GET() {
  try {
    console.log('🧪 Analytics Test API: Starting test...')

    const testResults = {
      timestamp: new Date().toISOString(),
      services: {} as Record<string, any>
    }

    // Test pilot analytics
    try {
      const pilotData = await getPilotAnalytics()
      testResults.services = {
        ...testResults.services,
        pilotAnalytics: {
          status: 'success',
          totalPilots: pilotData.total,
          captains: pilotData.captains,
          firstOfficers: pilotData.firstOfficers
        }
      }
    } catch (error) {
      testResults.services = {
        ...testResults.services,
        pilotAnalytics: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Test certification analytics
    try {
      const certificationData = await getCertificationAnalytics()
      testResults.services = {
        ...testResults.services,
        certificationAnalytics: {
          status: 'success',
          totalCertifications: certificationData.total,
          complianceRate: certificationData.complianceRate,
          expired: certificationData.expired,
          expiring: certificationData.expiring
        }
      }
    } catch (error) {
      testResults.services = {
        ...testResults.services,
        certificationAnalytics: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Test leave analytics
    try {
      const leaveData = await getLeaveAnalytics()
      testResults.services = {
        ...testResults.services,
        leaveAnalytics: {
          status: 'success',
          totalRequests: leaveData.totalRequests,
          pending: leaveData.pending,
          approved: leaveData.approved,
          denied: leaveData.denied
        }
      }
    } catch (error) {
      testResults.services = {
        ...testResults.services,
        leaveAnalytics: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Test fleet analytics
    try {
      const fleetData = await getFleetAnalytics()
      testResults.services = {
        ...testResults.services,
        fleetAnalytics: {
          status: 'success',
          utilization: fleetData.utilization,
          availability: fleetData.availability,
          readiness: fleetData.readiness
        }
      }
    } catch (error) {
      testResults.services = {
        ...testResults.services,
        fleetAnalytics: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Test trend analytics
    try {
      const trendData = await getTrendAnalytics(6) // 6 months
      testResults.services = {
        ...testResults.services,
        trendAnalytics: {
          status: 'success',
          periods: trendData.periods.length,
          latestPeriod: trendData.periods[trendData.periods.length - 1]
        }
      }
    } catch (error) {
      testResults.services = {
        ...testResults.services,
        trendAnalytics: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Test risk analytics
    try {
      const riskData = await getRiskAnalytics()
      testResults.services = {
        ...testResults.services,
        riskAnalytics: {
          status: 'success',
          overallRiskScore: riskData.overallRiskScore,
          criticalAlerts: riskData.criticalAlerts.length,
          riskFactors: riskData.riskFactors.length
        }
      }
    } catch (error) {
      testResults.services = {
        ...testResults.services,
        riskAnalytics: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Calculate overall test results
    const serviceKeys = Object.keys(testResults.services)
    const successfulServices = serviceKeys.filter(
      key => testResults.services[key as keyof typeof testResults.services].status === 'success'
    )
    const failedServices = serviceKeys.filter(
      key => testResults.services[key as keyof typeof testResults.services].status === 'error'
    )

    const summary = {
      totalServices: serviceKeys.length,
      successful: successfulServices.length,
      failed: failedServices.length,
      successRate: `${Math.round((successfulServices.length / serviceKeys.length) * 100)}%`,
      status: failedServices.length === 0 ? 'all_passed' : failedServices.length < serviceKeys.length ? 'partial_success' : 'all_failed'
    }

    console.log('✅ Analytics Test API: Test completed')
    console.log('📊 Test summary:', summary)

    return NextResponse.json({
      success: true,
      summary,
      results: testResults,
      message: `Analytics test completed. ${summary.successful}/${summary.totalServices} services working correctly.`
    })

  } catch (error) {
    console.error('❌ Analytics Test API: Test failed:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Analytics test failed due to unexpected error'
    }, { status: 500 })
  }
}

/**
 * POST /api/analytics/test
 * Run specific analytics test
 */
export async function POST(request: Request) {
  try {
    const { service, filters } = await request.json()

    console.log(`🧪 Analytics Test API: Testing specific service: ${service}`)

    let result

    switch (service) {
      case 'pilot':
        result = await getPilotAnalytics(filters)
        break
      case 'certification':
        result = await getCertificationAnalytics(filters)
        break
      case 'leave':
        result = await getLeaveAnalytics(filters)
        break
      case 'fleet':
        result = await getFleetAnalytics()
        break
      case 'trend':
        result = await getTrendAnalytics(filters?.months || 12)
        break
      case 'risk':
        result = await getRiskAnalytics()
        break
      default:
        throw new Error(`Unknown service: ${service}`)
    }

    console.log(`✅ Analytics Test API: ${service} service test passed`)

    return NextResponse.json({
      success: true,
      service,
      result,
      message: `${service} analytics service test passed`
    })

  } catch (error) {
    console.error('❌ Analytics Test API: Service test failed:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Service test failed'
    }, { status: 500 })
  }
}