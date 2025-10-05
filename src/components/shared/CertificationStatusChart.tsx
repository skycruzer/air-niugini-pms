'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

interface CertificationStatusData {
  current: number;
  expiring: number;
  expired: number;
}

interface CertificationStatusChartProps {
  data: CertificationStatusData;
  variant?: 'pie' | 'doughnut';
  height?: number;
  showLegend?: boolean;
}

/**
 * Shared component for displaying certification status distribution
 * Consolidates duplicate certification status charts across:
 * - Dashboard (pie chart)
 * - Analytics (doughnut chart)
 * - Compliance Metrics (pie chart)
 *
 * @param data - Certification status counts (current, expiring, expired)
 * @param variant - Chart type: 'pie' or 'doughnut' (default: 'pie')
 * @param height - Chart height in pixels (default: 300)
 * @param showLegend - Whether to display legend (default: true)
 */
export function CertificationStatusChart({
  data,
  variant = 'pie',
  height = 300,
  showLegend = true,
}: CertificationStatusChartProps) {
  const total = data.current + data.expiring + data.expired;

  // Prepare data for charts
  const chartData = [
    { name: 'Current', value: data.current, color: '#22c55e', fill: '#22c55e' },
    { name: 'Expiring Soon', value: data.expiring, color: '#f59e0b', fill: '#f59e0b' },
    { name: 'Expired', value: data.expired, color: '#ef4444', fill: '#ef4444' },
  ];

  if (variant === 'doughnut') {
    // Chart.js Doughnut configuration
    const doughnutData = {
      labels: chartData.map((d) => d.name),
      datasets: [
        {
          data: chartData.map((d) => d.value),
          backgroundColor: chartData.map((d) => d.color),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'bottom' as const,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    };

    return (
      <div style={{ height: `${height}px` }}>
        <Doughnut data={doughnutData} options={doughnutOptions} />
      </div>
    );
  }

  // Recharts Pie configuration (default)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0];
      const percentage = total > 0 ? ((dataItem.value / total) * 100).toFixed(1) : '0.0';

      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{dataItem.name}</p>
          <p className="text-2xl font-bold" style={{ color: dataItem.payload.color }}>
            {dataItem.value}
          </p>
          <p className="text-xs text-gray-600">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={height * 0.28}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm font-medium text-gray-700">
                  {value} ({entry.payload.value})
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
