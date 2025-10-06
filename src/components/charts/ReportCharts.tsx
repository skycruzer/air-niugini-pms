'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line, Pie, Radar, PolarArea } from 'react-chartjs-2'
import type {
  PilotAnalytics,
  CertificationAnalytics,
  LeaveAnalytics,
  FleetAnalytics,
  TrendAnalytics,
  AIR_NIUGINI_COLORS,
  ChartFilter,
  ExportOptions
} from '@/types/analytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
)

// Air Niugini brand colors with extended palette
const COLORS = {
  primary: '#E4002B',      // Air Niugini Red
  secondary: '#FFC72C',    // Air Niugini Gold
  success: '#059669',      // Green for current/good status
  warning: '#D97706',      // Amber for expiring/warning
  danger: '#DC2626',       // Red for expired/critical
  info: '#0EA5E9',         // Blue for information
  dark: '#1F2937',         // Dark gray for text
  light: '#F3F4F6',        // Light gray for backgrounds
  white: '#FFFFFF',
  // Extended palette for diverse charts
  purple: '#8B5CF6',
  pink: '#EC4899',
  teal: '#06B6D4',
  orange: '#F59E0B',
  indigo: '#6366F1',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
}

interface ExpiryTimelineChartProps {
  data: {
    next7Days: number
    next14Days: number
    next28Days: number
    next60Days: number
    next90Days: number
  }
}

export function ExpiryTimelineChart({ data }: ExpiryTimelineChartProps) {
  const chartData = {
    labels: ['7 Days', '14 Days', '28 Days', '60 Days', '90 Days'],
    datasets: [
      {
        label: 'Certifications Expiring',
        data: [data.next7Days, data.next14Days, data.next28Days, data.next60Days, data.next90Days],
        backgroundColor: [
          COLORS.danger,    // 7 days - critical
          COLORS.warning,   // 14 days - urgent
          COLORS.info,      // 28 days - important
          '#8B5CF6',        // 60 days - planning
          '#6366F1'         // 90 days - forecast
        ],
        borderColor: [
          COLORS.danger,
          COLORS.warning,
          COLORS.info,
          '#8B5CF6',
          '#6366F1'
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Certification Expiry Timeline',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  )
}

interface ComplianceDonutChartProps {
  data: {
    current: number
    expiring: number
    expired: number
  }
}

export function ComplianceDonutChart({ data }: ComplianceDonutChartProps) {
  const chartData = {
    labels: ['Current', 'Expiring Soon', 'Expired'],
    datasets: [
      {
        data: [data.current, data.expiring, data.expired],
        backgroundColor: [
          COLORS.success,
          COLORS.warning,
          COLORS.danger,
        ],
        borderColor: [
          COLORS.success,
          COLORS.warning,
          COLORS.danger,
        ],
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Certification Status Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
      },
    },
  }

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

interface PilotRequirementsChartProps {
  data: {
    current: { captains: number; firstOfficers: number }
    required: { captains: number; firstOfficers: number }
  }
}

export function PilotRequirementsChart({ data }: PilotRequirementsChartProps) {
  const chartData = {
    labels: ['Captains', 'First Officers'],
    datasets: [
      {
        label: 'Current',
        data: [data.current.captains, data.current.firstOfficers],
        backgroundColor: COLORS.info,
        borderColor: COLORS.info,
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Required',
        data: [data.required.captains, data.required.firstOfficers],
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Pilot Requirements vs Current',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  )
}

interface RiskTrendChartProps {
  data: {
    periods: string[]
    expiredCounts: number[]
    expiringCounts: number[]
  }
}

export function RiskTrendChart({ data }: RiskTrendChartProps) {
  const chartData = {
    labels: data.periods,
    datasets: [
      {
        label: 'Expired',
        data: data.expiredCounts,
        borderColor: COLORS.danger,
        backgroundColor: COLORS.danger + '20',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expiring Soon',
        data: data.expiringCounts,
        borderColor: COLORS.warning,
        backgroundColor: COLORS.warning + '20',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Risk Assessment Trend',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  )
}

interface CategoryBreakdownChartProps {
  data: Array<{
    category: string
    count: number
    pilotsAffected: number
  }>
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        label: 'Certifications',
        data: data.map(item => item.count),
        backgroundColor: [
          COLORS.primary,
          COLORS.secondary,
          COLORS.info,
          COLORS.success,
          COLORS.warning,
          '#8B5CF6',
          '#EC4899',
          '#06B6D4'
        ].slice(0, data.length),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Certifications by Category',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  )
}

interface AvailabilityGaugeProps {
  percentage: number
  label: string
}

export function AvailabilityGauge({ percentage, label }: AvailabilityGaugeProps) {
  const chartData = {
    labels: ['Available', 'Unavailable'],
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [
          percentage >= 90 ? COLORS.success :
          percentage >= 75 ? COLORS.warning : COLORS.danger,
          COLORS.light,
        ],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: label,
        font: {
          size: 14,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
      },
    },
  }

  return (
    <div className="h-40 relative">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            percentage >= 90 ? 'text-green-600' :
            percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {percentage}%
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Interactive Charts for Air Niugini Dashboard

interface PilotRoleDistributionChartProps {
  data: PilotAnalytics
  onClick?: (role: string) => void
}

export function PilotRoleDistributionChart({ data, onClick }: PilotRoleDistributionChartProps) {
  const chartData = {
    labels: ['Captains', 'First Officers', 'Training Captains', 'Examiners'],
    datasets: [
      {
        data: [data.captains, data.firstOfficers, data.trainingCaptains, data.examiners],
        backgroundColor: [
          COLORS.primary,
          COLORS.secondary,
          COLORS.info,
          COLORS.purple
        ],
        borderColor: COLORS.white,
        borderWidth: 3,
        hoverOffset: 10,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: 'normal' as const
          },
          color: COLORS.dark
        },
      },
      title: {
        display: true,
        text: 'Pilot Role Distribution',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = data.total
            const value = context.parsed
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0
            return `${context.label}: ${value} pilots (${percentage}%)`
          }
        },
        backgroundColor: COLORS.dark,
        titleColor: COLORS.white,
        bodyColor: COLORS.white,
        borderColor: COLORS.primary,
        borderWidth: 1
      }
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && onClick) {
        const index = elements[0].index
        const roles = ['captain', 'first_officer', 'training_captain', 'examiner']
        onClick(roles[index])
      }
    }
  }

  return (
    <div className="h-96 bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <Pie data={chartData} options={options} />
    </div>
  )
}

interface AgeDistributionChartProps {
  data: PilotAnalytics
  interactive?: boolean
}

export function AgeDistributionChart({ data, interactive = true }: AgeDistributionChartProps) {
  const chartData = {
    labels: ['Under 30', '30-40', '40-50', '50-60', 'Over 60'],
    datasets: [
      {
        label: 'Number of Pilots',
        data: [
          data.ageDistribution.under30,
          data.ageDistribution.age30to40,
          data.ageDistribution.age40to50,
          data.ageDistribution.age50to60,
          data.ageDistribution.over60
        ],
        backgroundColor: [
          COLORS.info,
          COLORS.secondary,
          COLORS.success,
          COLORS.warning,
          COLORS.danger
        ],
        borderColor: COLORS.dark,
        borderWidth: 1,
        borderRadius: 8,
        hoverBackgroundColor: [
          COLORS.info + '80',
          COLORS.secondary + '80',
          COLORS.success + '80',
          COLORS.warning + '80',
          COLORS.danger + '80'
        ]
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Pilot Age Distribution',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
        padding: 20
      },
      tooltip: {
        backgroundColor: COLORS.dark,
        titleColor: COLORS.white,
        bodyColor: COLORS.white,
        borderColor: COLORS.primary,
        borderWidth: 1,
        callbacks: {
          afterLabel: function(context: any) {
            const total = data.total
            const percentage = total > 0 ? Math.round((context.parsed.y / total) * 100) : 0
            return `${percentage}% of total pilots`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: COLORS.gray[600]
        },
        grid: {
          color: COLORS.gray[200]
        }
      },
      x: {
        ticks: {
          color: COLORS.gray[600]
        },
        grid: {
          display: false
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  }

  return (
    <div className="h-80 bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <Bar data={chartData} options={options} />
    </div>
  )
}

interface RetirementPlanningChartProps {
  data: PilotAnalytics
}

export function RetirementPlanningChart({ data }: RetirementPlanningChartProps) {
  const chartData = {
    labels: ['Retiring in 1 Year', 'Retiring in 2 Years', 'Retiring in 5 Years'],
    datasets: [
      {
        data: [
          data.retirementPlanning.retiringIn1Year,
          data.retirementPlanning.retiringIn2Years,
          data.retirementPlanning.retiringIn5Years
        ],
        backgroundColor: [
          COLORS.danger,
          COLORS.warning,
          COLORS.info
        ],
        borderColor: COLORS.white,
        borderWidth: 2,
        hoverOffset: 8
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'rect',
          font: {
            size: 12
          },
          color: COLORS.dark
        },
      },
      title: {
        display: true,
        text: 'Retirement Planning Overview',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
        padding: 20
      },
      tooltip: {
        backgroundColor: COLORS.dark,
        titleColor: COLORS.white,
        bodyColor: COLORS.white,
        borderColor: COLORS.primary,
        borderWidth: 1
      }
    }
  }

  return (
    <div className="h-80 bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

interface CertificationTrendChartProps {
  data: TrendAnalytics
  timeframe?: 'month' | 'quarter' | 'year'
}

export function CertificationTrendChart({ data, timeframe = 'month' }: CertificationTrendChartProps) {
  const chartData = {
    labels: data.periods,
    datasets: [
      {
        label: 'Total Certifications',
        data: data.certifications.total,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '20',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLORS.primary,
        pointBorderColor: COLORS.white,
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Expired',
        data: data.certifications.expired,
        borderColor: COLORS.danger,
        backgroundColor: COLORS.danger + '20',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLORS.danger,
        pointBorderColor: COLORS.white,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Expiring Soon',
        data: data.certifications.expiring,
        borderColor: COLORS.warning,
        backgroundColor: COLORS.warning + '20',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLORS.warning,
        pointBorderColor: COLORS.white,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          },
          color: COLORS.dark
        }
      },
      title: {
        display: true,
        text: `Certification Trends - ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}ly View`,
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
        padding: 20
      },
      tooltip: {
        backgroundColor: COLORS.dark,
        titleColor: COLORS.white,
        bodyColor: COLORS.white,
        borderColor: COLORS.primary,
        borderWidth: 1,
        callbacks: {
          afterLabel: function(context: any) {
            if (context.datasetIndex === 0) {
              const expired = data.certifications.expired[context.dataIndex] || 0
              const expiring = data.certifications.expiring[context.dataIndex] || 0
              const compliance = context.parsed.y > 0 ?
                Math.round(((context.parsed.y - expired - expiring) / context.parsed.y) * 100) : 100
              return `Compliance Rate: ${compliance}%`
            }
            return ''
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: COLORS.gray[600]
        },
        grid: {
          color: COLORS.gray[200]
        }
      },
      x: {
        ticks: {
          color: COLORS.gray[600],
          maxRotation: 45
        },
        grid: {
          display: false
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutCubic' as const
    }
  }

  return (
    <div className="h-96 bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <Line data={chartData} options={options} />
    </div>
  )
}

interface LeaveRequestTrendsChartProps {
  data: LeaveAnalytics
}

export function LeaveRequestTrendsChart({ data }: LeaveRequestTrendsChartProps) {
  const chartData = {
    labels: data.trends.monthlyRequests.map(m => m.month),
    datasets: [
      {
        label: 'Total Requests',
        data: data.trends.monthlyRequests.map(m => m.total),
        backgroundColor: COLORS.info,
        borderColor: COLORS.info,
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: 'Approved',
        data: data.trends.monthlyRequests.map(m => m.approved),
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: 'Denied',
        data: data.trends.monthlyRequests.map(m => m.denied),
        backgroundColor: COLORS.danger,
        borderColor: COLORS.danger,
        borderWidth: 2,
        borderRadius: 6
      }
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          },
          color: COLORS.dark
        }
      },
      title: {
        display: true,
        text: 'Leave Request Trends (Last 12 Months)',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
        padding: 20
      },
      tooltip: {
        backgroundColor: COLORS.dark,
        titleColor: COLORS.white,
        bodyColor: COLORS.white,
        borderColor: COLORS.primary,
        borderWidth: 1,
        callbacks: {
          afterBody: function(context: any) {
            const monthData = data.trends.monthlyRequests[context[0].dataIndex]
            const approvalRate = monthData.total > 0 ?
              Math.round((monthData.approved / monthData.total) * 100) : 0
            return [`Approval Rate: ${approvalRate}%`]
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: false,
        ticks: {
          stepSize: 1,
          color: COLORS.gray[600]
        },
        grid: {
          color: COLORS.gray[200]
        }
      },
      x: {
        ticks: {
          color: COLORS.gray[600],
          maxRotation: 45
        },
        grid: {
          display: false
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart' as const
    }
  }

  return (
    <div className="h-80 bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <Bar data={chartData} options={options} />
    </div>
  )
}

interface FleetReadinessGaugeProps {
  data: FleetAnalytics
}

export function FleetReadinessGauge({ data }: FleetReadinessGaugeProps) {
  const chartData = {
    labels: ['Fully Compliant', 'Minor Issues', 'Major Issues', 'Grounded'],
    datasets: [
      {
        data: [
          data.complianceStatus.fullyCompliant,
          data.complianceStatus.minorIssues,
          data.complianceStatus.majorIssues,
          data.complianceStatus.grounded
        ],
        backgroundColor: [
          COLORS.success,
          COLORS.secondary,
          COLORS.warning,
          COLORS.danger
        ],
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11
          },
          color: COLORS.dark
        },
      },
      title: {
        display: true,
        text: 'Fleet Compliance Status',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: COLORS.dark,
        padding: 20
      },
      tooltip: {
        backgroundColor: COLORS.dark,
        titleColor: COLORS.white,
        bodyColor: COLORS.white,
        borderColor: COLORS.primary,
        borderWidth: 1
      }
    }
  }

  const readinessScore = data.readiness

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="h-64 relative">
        <PolarArea data={chartData} options={options} />
      </div>
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${
              readinessScore >= 90 ? 'text-green-600' :
              readinessScore >= 75 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {readinessScore}%
            </div>
            <div className="text-sm text-gray-600 font-medium">Fleet Readiness</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.utilization}%
            </div>
            <div className="text-sm text-gray-600 font-medium">Utilization</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Chart Export Functionality
export const exportChart = (chartRef: any, options: ExportOptions) => {
  if (!chartRef.current) return

  const chart = chartRef.current
  const canvas = chart.canvas

  // Create download link
  const link = document.createElement('a')
  link.download = options.filename || `chart-${Date.now()}.${options.format}`

  if (options.format === 'png' || options.format === 'jpg') {
    link.href = canvas.toDataURL(`image/${options.format}`,
      options.resolution === 'high' ? 1.0 : options.resolution === 'medium' ? 0.8 : 0.6)
  }

  link.click()
}

// Interactive Chart Container with Export
interface InteractiveChartContainerProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  exportable?: boolean
  onExport?: () => void
  className?: string
}

export function InteractiveChartContainer({
  children,
  title,
  subtitle,
  exportable = true,
  onExport,
  className = ''
}: InteractiveChartContainerProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (onExport) {
      setIsExporting(true)
      try {
        await onExport()
      } finally {
        setIsExporting(false)
      }
    }
  }, [onExport])

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {exportable && (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <span>📊</span>
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        )}
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  )
}