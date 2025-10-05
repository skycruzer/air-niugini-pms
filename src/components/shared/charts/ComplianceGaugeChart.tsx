'use client';

import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface ComplianceGaugeChartProps {
  complianceRate: number;
}

export function ComplianceGaugeChart({ complianceRate }: ComplianceGaugeChartProps) {
  const data = [
    {
      name: 'Compliance',
      value: complianceRate,
      fill: complianceRate >= 95 ? '#22c55e' : complianceRate >= 85 ? '#f59e0b' : '#ef4444',
    },
  ];

  const CustomLabel = ({ viewBox }: any) => {
    const { cx, cy } = viewBox;
    return (
      <g>
        <text
          x={cx}
          y={cy - 10}
          className="recharts-text recharts-label"
          textAnchor="middle"
          dominantBaseline="central"
        >
          <tspan
            alignmentBaseline="middle"
            fontSize="32"
            fontWeight="bold"
            fill={data[0]?.fill || '#22c55e'}
          >
            {complianceRate}%
          </tspan>
        </text>
        <text
          x={cx}
          y={cy + 20}
          className="recharts-text recharts-label"
          textAnchor="middle"
          dominantBaseline="central"
        >
          <tspan fontSize="14" fill="#6b7280">
            Fleet Compliance
          </tspan>
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-[300px] flex items-center justify-center">
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
          <RadialBar
            background={{ fill: '#e5e7eb' }}
            dataKey="value"
            cornerRadius={10}
            label={<CustomLabel />}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Status Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div
          className={`flex items-center px-4 py-2 rounded-full ${
            complianceRate >= 95
              ? 'bg-green-100 text-green-800'
              : complianceRate >= 85
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          <span className="mr-2">
            {complianceRate >= 95 ? '✅' : complianceRate >= 85 ? '⚠️' : '❌'}
          </span>
          <span className="text-sm font-semibold">
            {complianceRate >= 95 ? 'Excellent' : complianceRate >= 85 ? 'Good' : 'Needs Attention'}
          </span>
        </div>
      </div>
    </div>
  );
}
