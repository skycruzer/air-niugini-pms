'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, addMonths, startOfMonth } from 'date-fns';

interface ExpiryTrendChartProps {
  expiringCertifications: Array<{
    expiry_date: string;
    check_types: {
      check_code: string;
    };
  }>;
}

export function ExpiryTrendChart({ expiringCertifications }: ExpiryTrendChartProps) {
  // Generate data for next 12 months
  const generateMonthlyData = () => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const month = addMonths(startOfMonth(today), i);
      const monthKey = format(month, 'MMM yyyy');

      // Count certifications expiring in this month
      const expiringInMonth = expiringCertifications.filter((cert) => {
        if (!cert.expiry_date) return false;
        const expiryDate = new Date(cert.expiry_date);
        return format(expiryDate, 'MMM yyyy') === monthKey;
      }).length;

      months.push({
        month: format(month, 'MMM'),
        expiring: expiringInMonth,
        cumulative: 0, // Will calculate after
      });
    }

    // Calculate cumulative
    let cumulative = 0;
    return months.map((m) => {
      cumulative += m.expiring;
      return { ...m, cumulative };
    });
  };

  const data = generateMonthlyData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-600 mr-4">Expiring:</span>
              <span className="text-lg font-bold text-amber-600">{payload[0].value}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600 mr-4">Cumulative:</span>
              <span className="text-lg font-bold text-red-600">{payload[1].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => (
              <span className="text-sm font-medium text-gray-700">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="expiring"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Expiring This Month"
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#ef4444"
            strokeWidth={2}
            name="Cumulative"
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
