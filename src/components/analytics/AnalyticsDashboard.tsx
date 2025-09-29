'use client'

import { useState, useEffect } from 'react'
import { BarChart, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle, Clock, RefreshCw, Download } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { getCertificationAnalytics, getPilotAnalytics, getTrendAnalytics, getLeaveAnalytics } from '@/lib/analytics-service'
import type { CertificationAnalytics, PilotAnalytics, TrendAnalytics, LeaveAnalytics } from '@/types/analytics'
import { AIR_NIUGINI_COLORS } from '@/types/analytics'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler
)

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [certificationData, setCertificationData] = useState<CertificationAnalytics | null>(null)
  const [pilotData, setPilotData] = useState<PilotAnalytics | null>(null)
  const [trendData, setTrendData] = useState<TrendAnalytics | null>(null)
  const [leaveData, setLeaveData] = useState<LeaveAnalytics | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadAnalyticsData = async () => {
    try {
      setRefreshing(true)
      console.log('📊 Loading analytics data...')

      const [certifications, pilots, trends, leave] = await Promise.all([
        getCertificationAnalytics(),
        getPilotAnalytics(),
        getTrendAnalytics(12),
        getLeaveAnalytics()
      ])

      setCertificationData(certifications)
      setPilotData(pilots)
      setTrendData(trends)
      setLeaveData(leave)
      setError(null)
    } catch (err) {
      console.error('❌ Error loading analytics:', err)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const handleRefresh = () => {
    loadAnalyticsData()
  }

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('📥 Exporting analytics data...')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Chart data preparation
  const certificationStatusData = certificationData ? {
    labels: ['Current', 'Expiring Soon', 'Expired'],
    datasets: [{
      data: [certificationData.current, certificationData.expiring, certificationData.expired],
      backgroundColor: [
        AIR_NIUGINI_COLORS.success,
        AIR_NIUGINI_COLORS.warning,
        AIR_NIUGINI_COLORS.danger
      ],
      borderColor: AIR_NIUGINI_COLORS.white,
      borderWidth: 2,
      cutout: '60%'
    }]
  } : null

  const pilotRoleData = pilotData ? {
    labels: ['Captains', 'First Officers'],
    datasets: [{
      label: 'Pilot Distribution',
      data: [pilotData.captains, pilotData.firstOfficers],
      backgroundColor: [AIR_NIUGINI_COLORS.primary, AIR_NIUGINI_COLORS.secondary],
      borderColor: [AIR_NIUGINI_COLORS.primary, AIR_NIUGINI_COLORS.secondary],
      borderWidth: 1,
      borderRadius: 4
    }]
  } : null

  const certificationTrendData = trendData ? {
    labels: trendData.periods,
    datasets: [
      {
        label: 'Total Certifications',
        data: trendData.certifications.total,
        borderColor: AIR_NIUGINI_COLORS.info,
        backgroundColor: `${AIR_NIUGINI_COLORS.info}20`,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Expired',
        data: trendData.certifications.expired,
        borderColor: AIR_NIUGINI_COLORS.danger,
        backgroundColor: `${AIR_NIUGINI_COLORS.danger}20`,
        fill: false,
        tension: 0.4
      }
    ]
  } : null

  const ageDistributionData = pilotData ? {
    labels: ['<30', '30-40', '40-50', '50-60', '60+'],
    datasets: [{
      label: 'Age Distribution',
      data: [
        pilotData.ageDistribution.under30,
        pilotData.ageDistribution.age30to40,
        pilotData.ageDistribution.age40to50,
        pilotData.ageDistribution.age50to60,
        pilotData.ageDistribution.over60
      ],
      backgroundColor: [
        `${AIR_NIUGINI_COLORS.info}90`,
        `${AIR_NIUGINI_COLORS.success}90`,
        `${AIR_NIUGINI_COLORS.warning}90`,
        `${AIR_NIUGINI_COLORS.danger}90`,
        `${AIR_NIUGINI_COLORS.dark}90`
      ],
      borderColor: AIR_NIUGINI_COLORS.white,
      borderWidth: 2
    }]
  } : null

  const leaveRequestsData = leaveData ? {
    labels: leaveData.trends.monthlyRequests.map(item => item.month),
    datasets: [
      {
        label: 'Total Requests',
        data: leaveData.trends.monthlyRequests.map(item => item.total),
        borderColor: AIR_NIUGINI_COLORS.primary,
        backgroundColor: `${AIR_NIUGINI_COLORS.primary}20`,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Approved',
        data: leaveData.trends.monthlyRequests.map(item => item.approved),
        borderColor: AIR_NIUGINI_COLORS.success,
        backgroundColor: `${AIR_NIUGINI_COLORS.success}20`,
        fill: false,
        tension: 0.4
      }
    ]
  } : null

  const categoryBreakdownData = certificationData ? {
    labels: certificationData.categoryBreakdown.map(cat => cat.category),
    datasets: [{
      label: 'Current',
      data: certificationData.categoryBreakdown.map(cat => cat.current),
      backgroundColor: AIR_NIUGINI_COLORS.success,
      borderColor: AIR_NIUGINI_COLORS.success,
      borderWidth: 1,
      borderRadius: 4
    }, {
      label: 'Expiring',
      data: certificationData.categoryBreakdown.map(cat => cat.expiring),
      backgroundColor: AIR_NIUGINI_COLORS.warning,
      borderColor: AIR_NIUGINI_COLORS.warning,
      borderWidth: 1,
      borderRadius: 4
    }, {
      label: 'Expired',
      data: certificationData.categoryBreakdown.map(cat => cat.expired),
      backgroundColor: AIR_NIUGINI_COLORS.danger,
      borderColor: AIR_NIUGINI_COLORS.danger,
      borderWidth: 1,
      borderRadius: 4
    }]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: AIR_NIUGINI_COLORS.dark,
        titleColor: AIR_NIUGINI_COLORS.white,
        bodyColor: AIR_NIUGINI_COLORS.white,
        borderColor: AIR_NIUGINI_COLORS.primary,
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: {
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif'
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        grid: {
          color: AIR_NIUGINI_COLORS.gray[200]
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: AIR_NIUGINI_COLORS.dark,
        titleColor: AIR_NIUGINI_COLORS.white,
        bodyColor: AIR_NIUGINI_COLORS.white,
        borderColor: AIR_NIUGINI_COLORS.primary,
        borderWidth: 1,
        cornerRadius: 8
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart className="w-7 h-7 text-[#E4002B] mr-3" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into pilot performance, certifications, and compliance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Pilots</p>
              <p className="text-2xl font-bold text-gray-900">{pilotData?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+2.3%</span>
            <span className="text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Certifications</p>
              <p className="text-2xl font-bold text-gray-900">{certificationData?.current || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+1.2%</span>
            <span className="text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">{certificationData?.expiring || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-600">-0.8%</span>
            <span className="text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Compliance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{certificationData?.complianceRate || 0}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+0.5%</span>
            <span className="text-gray-500 ml-2">vs last month</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certification Status Doughnut Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Certification Status</h2>
          <div className="h-80">
            {certificationStatusData ? (
              <Doughnut data={certificationStatusData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]"></div>
              </div>
            )}
          </div>
        </div>

        {/* Pilot Role Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pilot Role Distribution</h2>
          <div className="h-80">
            {pilotRoleData ? (
              <Bar data={pilotRoleData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]"></div>
              </div>
            )}
          </div>
        </div>

        {/* Certification Trends */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Certification Trends (12 Months)</h2>
          <div className="h-80">
            {certificationTrendData ? (
              <Line data={certificationTrendData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]"></div>
              </div>
            )}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Age Distribution</h2>
          <div className="h-80">
            {ageDistributionData ? (
              <Doughnut data={ageDistributionData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]"></div>
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests Trends */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Leave Requests Trends</h2>
          <div className="h-80">
            {leaveRequestsData ? (
              <Line data={leaveRequestsData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]"></div>
              </div>
            )}
          </div>
        </div>

        {/* Certification Category Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Certification Categories</h2>
          <div className="h-80">
            {categoryBreakdownData ? (
              <Bar data={categoryBreakdownData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
          <button className="text-sm text-[#E4002B] hover:text-[#C00020]">View All</button>
        </div>

        <div className="space-y-3">
          {certificationData && certificationData.expired > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800">{certificationData.expired} Pilots with Expired Certifications</h4>
                <p className="text-sm text-red-600 mt-1">Immediate action required for compliance</p>
              </div>
              <span className="text-xs text-red-600">2 hours ago</span>
            </div>
          )}

          {certificationData && certificationData.expiring > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800">{certificationData.expiring} Certifications Expiring Soon</h4>
                <p className="text-sm text-yellow-600 mt-1">Within the next 30 days</p>
              </div>
              <span className="text-xs text-yellow-600">1 day ago</span>
            </div>
          )}

          {(!certificationData || (certificationData.expired === 0 && certificationData.expiring === 0)) && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">All Certifications Current</h4>
                <p className="text-sm text-green-600 mt-1">No immediate action required</p>
              </div>
              <span className="text-xs text-green-600">Current</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}