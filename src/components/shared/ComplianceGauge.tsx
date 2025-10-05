'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface ComplianceGaugeProps {
  complianceRate: number;
  variant?: 'gauge' | 'card' | 'bar' | 'simple' | 'svg-circle';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showStatus?: boolean;
  className?: string;
}

/**
 * Shared component for displaying compliance rate across different visualizations
 * Consolidates duplicate compliance displays from:
 * - Dashboard (StatCard with progress bar)
 * - Analytics Dashboard (radial gauge)
 * - Compliance Metrics (SVG circular gauge)
 *
 * @param complianceRate - Compliance percentage (0-100)
 * @param variant - Display type: 'gauge' (radial), 'card' (stat card), 'bar' (progress), 'simple' (text), 'svg-circle' (manual SVG)
 * @param size - Component size: 'sm', 'md', 'lg'
 * @param showLabel - Whether to show compliance label
 * @param showStatus - Whether to show status indicator (Excellent/Good/Needs Attention)
 */
export function ComplianceGauge({
  complianceRate,
  variant = 'gauge',
  size = 'md',
  showLabel = true,
  showStatus = true,
  className = '',
}: ComplianceGaugeProps) {

  const getColor = () => {
    if (complianceRate >= 95) return { fill: '#22c55e', text: 'text-green-600', bg: 'bg-green-100' };
    if (complianceRate >= 85) return { fill: '#f59e0b', text: 'text-amber-600', bg: 'bg-amber-100' };
    return { fill: '#ef4444', text: 'text-red-600', bg: 'bg-red-100' };
  };

  const getStatusInfo = () => {
    if (complianceRate >= 95) return { emoji: '✅', label: 'Excellent', bg: 'bg-green-100 text-green-800' };
    if (complianceRate >= 85) return { emoji: '⚠️', label: 'Good', bg: 'bg-amber-100 text-amber-800' };
    return { emoji: '❌', label: 'Needs Attention', bg: 'bg-red-100 text-red-800' };
  };

  const color = getColor();
  const status = getStatusInfo();

  // Variant: Radial Gauge (Recharts)
  if (variant === 'gauge') {
    const data = [{ name: 'Compliance', value: complianceRate, fill: color.fill }];
    const height = size === 'sm' ? 200 : size === 'lg' ? 400 : 300;

    const CustomLabel = ({ viewBox }: any) => {
      const { cx, cy } = viewBox;
      return (
        <g>
          <text x={cx} y={cy - 10} className="recharts-text recharts-label" textAnchor="middle" dominantBaseline="central">
            <tspan alignmentBaseline="middle" fontSize={size === 'sm' ? '24' : size === 'lg' ? '40' : '32'} fontWeight="bold" fill={color.fill}>
              {complianceRate}%
            </tspan>
          </text>
          {showLabel && (
            <text x={cx} y={cy + 20} className="recharts-text recharts-label" textAnchor="middle" dominantBaseline="central">
              <tspan fontSize="14" fill="#6b7280">Fleet Compliance</tspan>
            </text>
          )}
        </g>
      );
    };

    return (
      <div className={`w-full h-[${height}px] flex items-center justify-center ${className}`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={20}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: '#e5e7eb' }} dataKey="value" cornerRadius={10} label={<CustomLabel />} />
          </RadialBarChart>
        </ResponsiveContainer>

        {showStatus && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className={`flex items-center px-4 py-2 rounded-full ${status.bg}`}>
              <span className="mr-2">{status.emoji}</span>
              <span className="text-sm font-semibold">{status.label}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant: SVG Circular Gauge (Manual SVG like ComplianceMetrics)
  if (variant === 'svg-circle') {
    const sizeClass = size === 'sm' ? 'w-32 h-32' : size === 'lg' ? 'w-64 h-64' : 'w-48 h-48';
    const fontSize = size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-5xl' : 'text-4xl';

    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClass}`}>
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-gray-200"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className={color.text}
              strokeWidth="10"
              strokeDasharray={`${complianceRate * 2.51} 251`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={`${fontSize} font-bold`}>{complianceRate}%</span>
            {showLabel && <span className="text-sm text-gray-600">Compliant</span>}
          </div>
        </div>
      </div>
    );
  }

  // Variant: Progress Bar
  if (variant === 'bar') {
    return (
      <div className={`space-y-2 ${className}`}>
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Compliance Rate</span>
            <span className={`text-sm font-bold ${color.text}`}>{complianceRate}%</span>
          </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.bg} ${color.text} border ${color.text.replace('text', 'border')}`}
            style={{ width: `${complianceRate}%` }}
          />
        </div>
        {showStatus && (
          <div className={`inline-flex items-center px-3 py-1 rounded-full ${status.bg} text-xs font-semibold`}>
            <span className="mr-1">{status.emoji}</span>
            {status.label}
          </div>
        )}
      </div>
    );
  }

  // Variant: Simple (just percentage with color)
  if (variant === 'simple') {
    const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl';
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`${textSize} font-bold ${color.text}`}>{complianceRate}%</span>
        {showLabel && <span className="text-sm text-gray-600">Compliance</span>}
        {showStatus && <span className="text-lg">{status.emoji}</span>}
      </div>
    );
  }

  // Variant: Card (StatCard-like display)
  return (
    <div className={`p-4 rounded-lg ${color.bg} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {showLabel && <p className="text-sm font-semibold text-gray-700 mb-1">Compliance Rate</p>}
          <p className={`text-3xl font-bold ${color.text}`}>{complianceRate}%</p>
          {showStatus && (
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <span>{status.emoji}</span>
              {status.label}
            </p>
          )}
        </div>
        <div className={`w-16 h-16 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-3xl font-bold border-2 ${color.text.replace('text', 'border')}`}>
          {complianceRate}
        </div>
      </div>
    </div>
  );
}
