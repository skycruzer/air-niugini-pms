/**
 * @fileoverview Enhanced Analytics Service for Air Niugini B767 PMS
 * Advanced analytics processing for interactive dashboard charts and KPIs
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

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
 * Uses API routes for data fetching to avoid client-side admin usage
 */
class AnalyticsService {

  /**
   * Get comprehensive pilot analytics for charts and KPIs
   */
  async getPilotAnalytics(filters?: ChartFilter): Promise<PilotAnalytics> {
    try {
      console.log('📊 Analytics Service: Getting pilot analytics...')

      const response = await fetch('/api/analytics/pilot')
      if (!response.ok) {
        throw new Error(`Failed to fetch pilot analytics: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get pilot analytics')
      }

      return result.data
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

      const response = await fetch('/api/analytics/certification')
      if (!response.ok) {
        throw new Error(`Failed to fetch certification analytics: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get certification analytics')
      }

      return result.data
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

      const response = await fetch('/api/analytics/leave')
      if (!response.ok) {
        throw new Error(`Failed to fetch leave analytics: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get leave analytics')
      }

      return result.data
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

      // Fleet readiness metrics based on real pilot and certification data
      const availability = Math.round(((totalPilots - pilotsOnLeave) / totalPilots) * 100)
      const readiness = Math.round((certificationAnalytics.complianceRate + availability) / 2)

      // Calculate real pilot status breakdown from leave data
      const currentLeaveRequests = leaveAnalytics.approved
      const availablePilots = totalPilots - currentLeaveRequests

      return {
        utilization: certificationAnalytics.complianceRate, // Use compliance rate as utilization metric
        availability,
        readiness,
        pilotAvailability: {
          available: availablePilots,
          onLeave: currentLeaveRequests,
          total: totalPilots
        },
        complianceStatus: {
          fullyCompliant: compliantPilots,
          minorIssues: certificationAnalytics.expiring,
          majorIssues: certificationAnalytics.expired,
          grounded: certificationAnalytics.expired // Pilots with expired certs are grounded
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

      const response = await fetch(`/api/analytics/trends?months=${months}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch trend analytics: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get trend analytics')
      }

      return result.data
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