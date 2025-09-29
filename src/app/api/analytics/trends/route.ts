import { NextRequest, NextResponse } from 'next/server'
import { format, subMonths, startOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    console.log('📈 API /analytics/trends: Getting trend analytics...')

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '12')

    const periods = []
    const today = new Date()

    // Generate periods (last N months)
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(today, i))
      periods.push(format(monthStart, 'MMM yyyy'))
    }

    // Generate realistic trend data based on current system values
    const generateTrendData = (baseValue: number, periods: number, trendRate: number, variance: number): number[] => {
      const data = []
      let currentValue = baseValue

      for (let i = 0; i < periods; i++) {
        // Add trend and random variance
        const trend = currentValue * trendRate * 0.01
        const randomVariance = (Math.random() - 0.5) * variance * 2
        currentValue = Math.max(0, currentValue + trend + randomVariance)
        data.push(Math.round(currentValue * 100) / 100)
      }

      return data
    }

    // For now, generate simulated trend data
    // In production, this would query historical data
    const pilots = {
      total: generateTrendData(27, periods.length, 0.5, 2),
      captains: generateTrendData(19, periods.length, 0.3, 1),
      firstOfficers: generateTrendData(8, periods.length, 0.4, 1)
    }

    const certifications = {
      total: generateTrendData(556, periods.length, 1, 10),
      expired: generateTrendData(8, periods.length, -0.2, 2),
      expiring: generateTrendData(15, periods.length, 0.1, 3),
      complianceRate: generateTrendData(95, periods.length, 0.1, 2)
    }

    const leave = {
      requests: generateTrendData(12, periods.length, 0.2, 3),
      approvalRate: generateTrendData(85, periods.length, 0.05, 5)
    }

    const performance = {
      responseTime: generateTrendData(150, periods.length, -0.1, 20),
      systemUptime: generateTrendData(99.5, periods.length, 0.01, 0.5)
    }

    const result = {
      periods,
      pilots,
      certifications,
      leave,
      performance
    }

    console.log('✅ API /analytics/trends: Successfully retrieved trend analytics')
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('❌ API /analytics/trends: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get trend analytics' },
      { status: 500 }
    )
  }
}