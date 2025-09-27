/**
 * @fileoverview Enhanced Analytics Service for Air Niugini B767 PMS
 * Advanced analytics processing for interactive dashboard charts and KPIs
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { cacheService } from '@/lib/cache-service'
import { differenceInYears, differenceInDays, format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import type {
  PilotAnalytics,
  CertificationAnalytics,
  LeaveAnalytics,
  FleetAnalytics,
  TrendAnalytics,
  RiskAnalytics,
  KPIMetric,
  AnalyticsAlert,
  ChartFilter,
  AnalyticsQuery,
  AnalyticsResult
} from '@/types/analytics'

/**
 * Enhanced Analytics Service with comprehensive data processing
 */
class AnalyticsService {
  private readonly supabaseAdmin = getSupabaseAdmin()

  /**
   * Get comprehensive pilot analytics for charts and KPIs
   */
  async getPilotAnalytics(filters?: ChartFilter): Promise<PilotAnalytics> {
    try {
      console.log('📊 Analytics Service: Getting pilot analytics...')

      // Get base pilot data with additional calculations
      const { data: pilots, error } = await this.supabaseAdmin
        .from('pilots')
        .select(`
          id,
          first_name,
          last_name,
          rank,
          contract_type,
          commencement_date,
          date_of_birth,
          is_active,
          captain_qualifications,
          updated_at
        `)

      if (error) throw error

      const activePilots = pilots?.filter((p: any) => p.is_active === true) || []
      const today = new Date()

      // Calculate age distribution
      const ageDistribution = {
        under30: 0,
        age30to40: 0,
        age40to50: 0,
        age50to60: 0,
        over60: 0
      }

      // Calculate seniority distribution
      const seniorityDistribution = {
        junior: 0,    // 0-5 years
        mid: 0,       // 5-15 years
        senior: 0     // 15+ years
      }

      // Calculate retirement planning
      const retirementPlanning = {
        retiringIn1Year: 0,
        retiringIn2Years: 0,
        retiringIn5Years: 0
      }

      // Count role distribution
      let captains = 0
      let firstOfficers = 0
      let trainingCaptains = 0
      let examiners = 0
      let lineCaptains = 0

      activePilots.forEach((pilot: any) => {
        // Age analysis
        if (pilot.date_of_birth) {
          const age = differenceInYears(today, new Date(pilot.date_of_birth))
          if (age < 30) ageDistribution.under30++
          else if (age < 40) ageDistribution.age30to40++
          else if (age < 50) ageDistribution.age40to50++
          else if (age < 60) ageDistribution.age50to60++
          else ageDistribution.over60++

          // Retirement planning (assuming retirement at 65)
          const yearsToRetirement = 65 - age
          if (yearsToRetirement <= 1) retirementPlanning.retiringIn1Year++
          else if (yearsToRetirement <= 2) retirementPlanning.retiringIn2Years++
          else if (yearsToRetirement <= 5) retirementPlanning.retiringIn5Years++
        }

        // Seniority analysis
        if (pilot.commencement_date) {
          const yearsOfService = differenceInYears(today, new Date(pilot.commencement_date))
          if (yearsOfService < 5) seniorityDistribution.junior++
          else if (yearsOfService < 15) seniorityDistribution.mid++
          else seniorityDistribution.senior++
        }

        // Role distribution
        if (pilot.rank === 'Captain') {
          captains++

          // Check for special qualifications
          const qualifications = pilot.captain_qualifications || {}
          if (qualifications.line_captain) lineCaptains++
          if (qualifications.training_captain) trainingCaptains++
          if (qualifications.examiner) examiners++
        } else if (pilot.rank === 'First Officer') {
          firstOfficers++
        }
      })

      return {
        total: pilots?.length || 0,
        active: activePilots.length,
        inactive: (pilots?.length || 0) - activePilots.length,
        captains,
        firstOfficers,
        trainingCaptains,
        examiners,
        lineCaptains,
        ageDistribution,
        seniorityDistribution,
        retirementPlanning
      }

    } catch (error) {
      console.error('❌ Analytics Service: Error getting pilot analytics:', error)
      throw error
    }
  }

  /**
   * Get comprehensive certification analytics for charts
   */
  async getCertificationAnalytics(filters?: ChartFilter): Promise<CertificationAnalytics> {
    try {
      console.log('📋 Analytics Service: Getting certification analytics...')

      // Get certification data with check types
      const { data: certifications, error } = await this.supabaseAdmin
        .from('pilot_checks')
        .select(`
          id,
          pilot_id,
          check_type_id,
          expiry_date,
          status,
          check_types (
            id,
            name,
            category,
            required_for_captains,
            required_for_first_officers
          )
        `)

      if (error) throw error

      const today = new Date()
      const certs = certifications || []

      // Calculate status distribution
      let current = 0
      let expiring = 0
      let expired = 0

      // Expiry timeline
      const expiryTimeline = {
        next7Days: 0,
        next14Days: 0,
        next30Days: 0,
        next60Days: 0,
        next90Days: 0
      }

      // Category breakdown
      const categoryMap = new Map<string, {
        total: number
        current: number
        expiring: number
        expired: number
      }>()

      // Check type distribution
      const checkTypeMap = new Map<string, {
        count: number
        pilotsAffected: Set<string>
        expiryDates: Date[]
      }>()

      certs.forEach((cert: any) => {
        const expiryDate = cert.expiry_date ? new Date(cert.expiry_date) : null
        const checkType = cert.check_types?.name || 'Unknown'
        const category = cert.check_types?.category || 'General'

        // Initialize category if not exists
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total: 0, current: 0, expiring: 0, expired: 0 })
        }
        const categoryStats = categoryMap.get(category)!

        // Initialize check type if not exists
        if (!checkTypeMap.has(checkType)) {
          checkTypeMap.set(checkType, {
            count: 0,
            pilotsAffected: new Set(),
            expiryDates: []
          })
        }
        const checkTypeStats = checkTypeMap.get(checkType)!

        categoryStats.total++
        checkTypeStats.count++
        checkTypeStats.pilotsAffected.add(cert.pilot_id)

        if (expiryDate) {
          checkTypeStats.expiryDates.push(expiryDate)
          const daysToExpiry = differenceInDays(expiryDate, today)

          // Status classification
          if (daysToExpiry < 0) {
            expired++
            categoryStats.expired++
          } else if (daysToExpiry <= 30) {
            expiring++
            categoryStats.expiring++
          } else {
            current++
            categoryStats.current++
          }

          // Timeline classification
          if (daysToExpiry >= 0 && daysToExpiry <= 7) expiryTimeline.next7Days++
          if (daysToExpiry >= 0 && daysToExpiry <= 14) expiryTimeline.next14Days++
          if (daysToExpiry >= 0 && daysToExpiry <= 30) expiryTimeline.next30Days++
          if (daysToExpiry >= 0 && daysToExpiry <= 60) expiryTimeline.next60Days++
          if (daysToExpiry >= 0 && daysToExpiry <= 90) expiryTimeline.next90Days++
        } else {
          // No expiry date - treat as expired
          expired++
          categoryStats.expired++
        }
      })

      // Convert maps to arrays
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        ...stats
      }))

      const checkTypeDistribution = Array.from(checkTypeMap.entries()).map(([checkType, stats]) => {
        const averageDaysToExpiry = stats.expiryDates.length > 0
          ? stats.expiryDates.reduce((sum, date) => sum + differenceInDays(date, today), 0) / stats.expiryDates.length
          : 0

        return {
          checkType,
          count: stats.count,
          pilotsAffected: stats.pilotsAffected.size,
          averageDaysToExpiry: Math.round(averageDaysToExpiry)
        }
      })

      const total = current + expiring + expired
      const complianceRate = total > 0 ? Math.round((current / total) * 100) : 100

      return {
        total,
        current,
        expiring,
        expired,
        complianceRate,
        expiryTimeline,
        categoryBreakdown,
        checkTypeDistribution
      }

    } catch (error) {
      console.error('❌ Analytics Service: Error getting certification analytics:', error)
      throw error
    }
  }

  /**
   * Get leave analytics with trends and patterns
   */
  async getLeaveAnalytics(filters?: ChartFilter): Promise<LeaveAnalytics> {
    try {
      console.log('📅 Analytics Service: Getting leave analytics...')

      const { data: leaveRequests, error } = await this.supabaseAdmin
        .from('leave_requests')
        .select(`
          id,
          pilot_name,
          request_type,
          status,
          start_date,
          end_date,
          created_at,
          approved_at,
          denied_at
        `)

      if (error) throw error

      const requests = leaveRequests || []
      const today = new Date()
      const thisMonth = startOfMonth(today)
      const lastMonth = startOfMonth(subMonths(today, 1))

      // Basic counts
      const totalRequests = requests.length
      const pending = requests.filter((r: any) => r.status === 'PENDING').length
      const approved = requests.filter((r: any) => r.status === 'APPROVED').length
      const denied = requests.filter((r: any) => r.status === 'DENIED').length

      // Monthly counts
      const thisMonthRequests = requests.filter((r: any) =>
        new Date(r.created_at) >= thisMonth
      ).length

      const lastMonthRequests = requests.filter((r: any) => {
        const createdAt = new Date(r.created_at)
        return createdAt >= lastMonth && createdAt < thisMonth
      }).length

      // Type breakdown
      const typeBreakdown = {
        RDO: requests.filter((r: any) => r.request_type === 'RDO').length,
        WDO: requests.filter((r: any) => r.request_type === 'WDO').length,
        Annual: requests.filter((r: any) => r.request_type === 'Annual').length,
        Sick: requests.filter((r: any) => r.request_type === 'Sick').length,
        Emergency: requests.filter((r: any) => r.request_type === 'Emergency').length
      }

      // Monthly trends (last 12 months)
      const monthlyRequests = []
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(today, i))
        const monthEnd = endOfMonth(monthStart)
        const monthName = format(monthStart, 'MMM yyyy')

        const monthRequests = requests.filter((r: any) => {
          const createdAt = new Date(r.created_at)
          return createdAt >= monthStart && createdAt <= monthEnd
        })

        monthlyRequests.push({
          month: monthName,
          total: monthRequests.length,
          approved: monthRequests.filter((r: any) => r.status === 'APPROVED').length,
          denied: monthRequests.filter((r: any) => r.status === 'DENIED').length
        })
      }

      // Seasonal patterns (quarters)
      const seasonalPattern = [
        {
          quarter: 'Q1',
          averageRequests: Math.round(monthlyRequests.slice(0, 3).reduce((sum, m) => sum + m.total, 0) / 3)
        },
        {
          quarter: 'Q2',
          averageRequests: Math.round(monthlyRequests.slice(3, 6).reduce((sum, m) => sum + m.total, 0) / 3)
        },
        {
          quarter: 'Q3',
          averageRequests: Math.round(monthlyRequests.slice(6, 9).reduce((sum, m) => sum + m.total, 0) / 3)
        },
        {
          quarter: 'Q4',
          averageRequests: Math.round(monthlyRequests.slice(9, 12).reduce((sum, m) => sum + m.total, 0) / 3)
        }
      ]

      return {
        totalRequests,
        pending,
        approved,
        denied,
        thisMonth: thisMonthRequests,
        lastMonth: lastMonthRequests,
        trends: {
          monthlyRequests,
          seasonalPattern
        },
        typeBreakdown
      }

    } catch (error) {
      console.error('❌ Analytics Service: Error getting leave analytics:', error)
      throw error
    }
  }

  /**
   * Get fleet utilization and readiness analytics
   */
  async getFleetAnalytics(): Promise<FleetAnalytics> {
    try {
      console.log('✈️ Analytics Service: Getting fleet analytics...')

      // Get pilot availability data
      const pilotAnalytics = await this.getPilotAnalytics()
      const certificationAnalytics = await this.getCertificationAnalytics()
      const leaveAnalytics = await this.getLeaveAnalytics()

      // Calculate fleet readiness based on pilot compliance
      const totalPilots = pilotAnalytics.total
      const compliantPilots = Math.round((certificationAnalytics.complianceRate / 100) * totalPilots)
      const pilotsOnLeave = leaveAnalytics.approved + leaveAnalytics.pending

      // Fleet metrics (simulated based on pilot data)
      const utilization = Math.min(95, Math.round(75 + (compliantPilots / totalPilots) * 20))
      const availability = Math.round(((totalPilots - pilotsOnLeave) / totalPilots) * 100)
      const readiness = Math.round((certificationAnalytics.complianceRate + availability) / 2)

      return {
        utilization,
        availability,
        readiness,
        operationalMetrics: {
          totalFlightHours: 8450, // Simulated
          averageUtilization: utilization,
          maintenanceHours: 120, // Simulated
          groundTime: 24 - Math.round(utilization * 0.24) // Simulated
        },
        pilotAvailability: {
          available: totalPilots - pilotsOnLeave,
          onDuty: Math.round(totalPilots * 0.7), // Simulated
          onLeave: pilotsOnLeave,
          training: Math.round(totalPilots * 0.1), // Simulated
          medical: Math.round(totalPilots * 0.02) // Simulated
        },
        complianceStatus: {
          fullyCompliant: compliantPilots,
          minorIssues: Math.round(certificationAnalytics.expiring * 0.6),
          majorIssues: Math.round(certificationAnalytics.expired * 0.8),
          grounded: Math.max(0, certificationAnalytics.expired - Math.round(certificationAnalytics.expired * 0.8))
        }
      }

    } catch (error) {
      console.error('❌ Analytics Service: Error getting fleet analytics:', error)
      throw error
    }
  }

  /**
   * Get trend analysis for time-series charts
   */
  async getTrendAnalytics(months: number = 12): Promise<TrendAnalytics> {
    try {
      console.log('📈 Analytics Service: Getting trend analytics...')

      const periods = []
      const today = new Date()

      // Generate periods (last N months)
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(today, i))
        periods.push(format(monthStart, 'MMM yyyy'))
      }

      // For now, generate simulated trend data
      // In production, this would query historical data
      const pilots = {
        total: this.generateTrendData(27, periods.length, 0.5, 2),
        captains: this.generateTrendData(15, periods.length, 0.3, 1),
        firstOfficers: this.generateTrendData(12, periods.length, 0.4, 1)
      }

      const certifications = {
        total: this.generateTrendData(531, periods.length, 1, 10),
        expired: this.generateTrendData(8, periods.length, -0.2, 2),
        expiring: this.generateTrendData(15, periods.length, 0.1, 3),
        complianceRate: this.generateTrendData(95, periods.length, 0.1, 2)
      }

      const leave = {
        requests: this.generateTrendData(12, periods.length, 0.2, 3),
        approvalRate: this.generateTrendData(85, periods.length, 0.05, 5)
      }

      const performance = {
        responseTime: this.generateTrendData(150, periods.length, -0.1, 20),
        systemUptime: this.generateTrendData(99.5, periods.length, 0.01, 0.5)
      }

      return {
        periods,
        pilots,
        certifications,
        leave,
        performance
      }

    } catch (error) {
      console.error('❌ Analytics Service: Error getting trend analytics:', error)
      throw error
    }
  }

  /**
   * Get risk analytics and alerts
   */
  async getRiskAnalytics(): Promise<RiskAnalytics> {
    try {
      console.log('⚠️ Analytics Service: Getting risk analytics...')

      const certificationAnalytics = await this.getCertificationAnalytics()
      const pilotAnalytics = await this.getPilotAnalytics()

      // Calculate overall risk score (0-100, lower is better)
      const certificationRisk = (certificationAnalytics.expired / certificationAnalytics.total) * 40
      const expiringRisk = (certificationAnalytics.expiring / certificationAnalytics.total) * 20
      const retirementRisk = (pilotAnalytics.retirementPlanning.retiringIn2Years / pilotAnalytics.total) * 30
      const overallRiskScore = Math.round(certificationRisk + expiringRisk + retirementRisk)

      const riskFactors = [
        {
          factor: 'Expired Certifications',
          severity: certificationAnalytics.expired > 10 ? 'critical' :
                   certificationAnalytics.expired > 5 ? 'high' : 'medium' as 'low' | 'medium' | 'high' | 'critical',
          impact: certificationRisk,
          trend: 'improving' as 'improving' | 'stable' | 'worsening',
          description: `${certificationAnalytics.expired} certifications have expired`
        },
        {
          factor: 'Expiring Certifications',
          severity: certificationAnalytics.expiring > 20 ? 'high' : 'medium' as 'low' | 'medium' | 'high' | 'critical',
          impact: expiringRisk,
          trend: 'stable' as 'improving' | 'stable' | 'worsening',
          description: `${certificationAnalytics.expiring} certifications expiring within 30 days`
        },
        {
          factor: 'Retirement Planning',
          severity: pilotAnalytics.retirementPlanning.retiringIn2Years > 3 ? 'high' : 'low' as 'low' | 'medium' | 'high' | 'critical',
          impact: retirementRisk,
          trend: 'worsening' as 'improving' | 'stable' | 'worsening',
          description: `${pilotAnalytics.retirementPlanning.retiringIn2Years} pilots retiring within 2 years`
        }
      ]

      const criticalAlerts = []

      // Generate alerts for critical issues
      if (certificationAnalytics.expired > 5) {
        criticalAlerts.push({
          id: 'expired-certs-critical',
          type: 'certification' as 'certification',
          severity: 'critical' as 'critical',
          title: 'Critical: Multiple Expired Certifications',
          description: `${certificationAnalytics.expired} certifications have expired and require immediate attention`,
          affectedItems: certificationAnalytics.expired,
          createdAt: new Date()
        })
      }

      if (certificationAnalytics.expiring > 15) {
        criticalAlerts.push({
          id: 'expiring-certs-high',
          type: 'certification' as 'certification',
          severity: 'high' as 'high',
          title: 'High Priority: Multiple Expiring Certifications',
          description: `${certificationAnalytics.expiring} certifications expiring within 30 days`,
          affectedItems: certificationAnalytics.expiring,
          createdAt: new Date()
        })
      }

      const complianceGaps = certificationAnalytics.categoryBreakdown
        .filter(cat => cat.expired > 0 || cat.expiring > 3)
        .map(cat => ({
          category: cat.category,
          missingCount: cat.expired + cat.expiring,
          pilotsAffected: [], // Would be calculated from actual data
          priority: cat.expired > 0 ? 'high' : 'medium' as 'low' | 'medium' | 'high'
        }))

      return {
        overallRiskScore,
        riskFactors,
        criticalAlerts,
        complianceGaps
      }

    } catch (error) {
      console.error('❌ Analytics Service: Error getting risk analytics:', error)
      throw error
    }
  }

  /**
   * Helper method to generate realistic trend data
   */
  private generateTrendData(baseValue: number, periods: number, trendRate: number, variance: number): number[] {
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

  /**
   * Execute custom analytics query
   */
  async executeAnalyticsQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    try {
      console.log('🔍 Analytics Service: Executing custom query:', query.type)

      const startTime = Date.now()
      let data = []

      // Execute query based on type
      switch (query.type) {
        case 'pilot':
          data = await this.executePilotQuery(query)
          break
        case 'certification':
          data = await this.executeCertificationQuery(query)
          break
        case 'leave':
          data = await this.executeLeaveQuery(query)
          break
        case 'fleet':
          data = await this.executeFleetQuery(query)
          break
        default:
          throw new Error(`Unsupported query type: ${query.type}`)
      }

      const executionTime = Date.now() - startTime

      return {
        query,
        data,
        metadata: {
          totalRecords: data.length,
          executionTime,
          cacheUsed: false,
          lastUpdated: new Date()
        },
        charts: {
          recommended: this.getRecommendedCharts(query.type),
          available: ['bar', 'line', 'pie', 'doughnut', 'area']
        }
      }

    } catch (error) {
      console.error('❌ Analytics Service: Error executing query:', error)
      throw error
    }
  }

  /**
   * Get recommended chart types for data type
   */
  private getRecommendedCharts(type: string): string[] {
    const recommendations = {
      pilot: ['bar', 'pie', 'doughnut'],
      certification: ['line', 'bar', 'area'],
      leave: ['line', 'bar'],
      fleet: ['gauge', 'bar', 'line']
    }

    return recommendations[type as keyof typeof recommendations] || ['bar']
  }

  /**
   * Execute pilot-specific queries
   */
  private async executePilotQuery(query: AnalyticsQuery): Promise<any[]> {
    // Implementation would depend on specific query requirements
    const pilotAnalytics = await this.getPilotAnalytics(query.filters)
    return [pilotAnalytics]
  }

  /**
   * Execute certification-specific queries
   */
  private async executeCertificationQuery(query: AnalyticsQuery): Promise<any[]> {
    const certificationAnalytics = await this.getCertificationAnalytics(query.filters)
    return [certificationAnalytics]
  }

  /**
   * Execute leave-specific queries
   */
  private async executeLeaveQuery(query: AnalyticsQuery): Promise<any[]> {
    const leaveAnalytics = await this.getLeaveAnalytics(query.filters)
    return [leaveAnalytics]
  }

  /**
   * Execute fleet-specific queries
   */
  private async executeFleetQuery(query: AnalyticsQuery): Promise<any[]> {
    const fleetAnalytics = await this.getFleetAnalytics()
    return [fleetAnalytics]
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()

// Export convenience functions
export const getPilotAnalytics = (filters?: ChartFilter) => analyticsService.getPilotAnalytics(filters)
export const getCertificationAnalytics = (filters?: ChartFilter) => analyticsService.getCertificationAnalytics(filters)
export const getLeaveAnalytics = (filters?: ChartFilter) => analyticsService.getLeaveAnalytics(filters)
export const getFleetAnalytics = () => analyticsService.getFleetAnalytics()
export const getTrendAnalytics = (months?: number) => analyticsService.getTrendAnalytics(months)
export const getRiskAnalytics = () => analyticsService.getRiskAnalytics()
export const executeAnalyticsQuery = (query: AnalyticsQuery) => analyticsService.executeAnalyticsQuery(query)