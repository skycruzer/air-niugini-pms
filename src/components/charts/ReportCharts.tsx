'use client'

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
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

// Air Niugini brand colors
const COLORS = {
  primary: '#E4002B',
  secondary: '#FFC72C',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0EA5E9',
  dark: '#1F2937',
  light: '#F3F4F6'
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