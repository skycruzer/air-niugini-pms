'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface PilotDistributionChartProps {
  captains: number;
  firstOfficers: number;
  trainingCaptains: number;
  examiners: number;
}

export function PilotDistributionChart({
  captains,
  firstOfficers,
  trainingCaptains,
  examiners,
}: PilotDistributionChartProps) {
  const data = [
    {
      name: 'Captains',
      count: captains,
      color: '#4F46E5',
    },
    {
      name: 'First Officers',
      count: firstOfficers,
      color: '#06B6D4',
    },
    {
      name: 'Training Captains',
      count: trainingCaptains,
      color: '#3b82f6',
    },
    {
      name: 'Examiners',
      count: examiners,
      color: '#a855f7',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.payload.name}</p>
          <p className="text-2xl font-bold" style={{ color: data.payload.color }}>
            {data.value}
          </p>
          <p className="text-xs text-gray-600">Active pilots</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => (
              <span className="text-sm font-medium text-gray-700">Pilot Count</span>
            )}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Count">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
