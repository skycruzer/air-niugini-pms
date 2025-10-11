/**
 * AUDIT LOG CHARTS COMPONENT
 *
 * Interactive visualizations for audit log data using Recharts.
 * Displays activity trends, user activity, and action distributions.
 *
 * Features:
 * - Activity timeline chart (daily activity)
 * - Action distribution pie chart
 * - User activity bar chart
 * - Table modification heatmap
 * - Air Niugini branding
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AuditStats } from '@/lib/audit-log-service';

interface AuditLogChartsProps {
  stats: AuditStats;
}

const ACTION_COLORS = {
  INSERT: '#10b981', // green
  UPDATE: '#3b82f6', // blue
  DELETE: '#ef4444', // red
  RESTORE: '#8b5cf6', // purple
  SOFT_DELETE: '#f59e0b', // amber
};

const PRIMARY_INDIGO = '#4F46E5';
const ACCENT_CYAN = '#06B6D4';

export function AuditLogCharts({ stats }: AuditLogChartsProps) {
  // Prepare data for activity timeline
  const activityTimelineData = useMemo(() => {
    return stats.recentActivity.map((activity) => ({
      date: activity.date,
      count: activity.count,
      formattedDate: new Date(activity.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [stats.recentActivity]);

  // Prepare data for action distribution
  const actionDistributionData = useMemo(() => {
    return Object.entries(stats.actionBreakdown)
      .filter(([_, count]) => count > 0)
      .map(([action, count]) => ({
        name: action,
        value: count,
        percentage: ((count / stats.totalLogs) * 100).toFixed(1),
      }));
  }, [stats.actionBreakdown, stats.totalLogs]);

  // Prepare data for user activity
  const userActivityData = useMemo(() => {
    return stats.userActivity.slice(0, 10).map((user) => ({
      name: user.user_email.split('@')[0], // Show only username part
      count: user.count,
      role: user.user_role,
    }));
  }, [stats.userActivity]);

  // Prepare data for table activity
  const tableActivityData = useMemo(() => {
    return stats.tableActivity.slice(0, 10).map((table) => ({
      name: table.table_name,
      count: table.count,
    }));
  }, [stats.tableActivity]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-gray-700">
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Total Logs</p>
              <p className="text-2xl font-black text-blue-900">
                {stats.totalLogs.toLocaleString()}
              </p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase mb-1">Active Users</p>
              <p className="text-2xl font-black text-green-900">{stats.totalUsers}</p>
            </div>
            <span className="text-4xl">👥</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase mb-1">
                Tables Modified
              </p>
              <p className="text-2xl font-black text-purple-900">{stats.totalTables}</p>
            </div>
            <span className="text-4xl">🗄️</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Most Active</p>
              <p className="text-xs font-bold text-amber-900 truncate">
                {stats.userActivity[0]?.user_email.split('@')[0] || 'N/A'}
              </p>
              <p className="text-xs text-amber-700">{stats.userActivity[0]?.count || 0} actions</p>
            </div>
            <span className="text-4xl">🏆</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <span className="mr-2">📈</span>
              Activity Timeline
            </h3>
            <p className="text-sm text-gray-600">Daily audit log activity over time</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="formattedDate" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={PRIMARY_INDIGO}
                strokeWidth={3}
                dot={{ fill: PRIMARY_INDIGO, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Action Distribution Pie Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <span className="mr-2">🍰</span>
              Action Distribution
            </h3>
            <p className="text-sm text-gray-600">Breakdown of audit actions</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={actionDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {actionDistributionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={ACTION_COLORS[entry.name as keyof typeof ACTION_COLORS] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {actionDistributionData.map((entry) => (
              <div key={entry.name} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      ACTION_COLORS[entry.name as keyof typeof ACTION_COLORS] || '#6b7280',
                  }}
                 />
                <span className="text-xs font-medium text-gray-700">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity Bar Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <span className="mr-2">👥</span>
              Top Users by Activity
            </h3>
            <p className="text-sm text-gray-600">Most active users in the system</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={PRIMARY_INDIGO} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table Activity Bar Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <span className="mr-2">🗄️</span>
              Table Modification Activity
            </h3>
            <p className="text-sm text-gray-600">Most frequently modified tables</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tableActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={ACCENT_CYAN} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Action Breakdown */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <span className="mr-2">📋</span>
            Detailed Action Breakdown
          </h3>
          <p className="text-sm text-gray-600">Complete statistics for all action types</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.actionBreakdown).map(([action, count]) => {
            const percentage =
              stats.totalLogs > 0 ? ((count / stats.totalLogs) * 100).toFixed(1) : '0';
            const color = ACTION_COLORS[action as keyof typeof ACTION_COLORS] || '#6b7280';

            return (
              <div
                key={action}
                className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
                style={{ borderColor: color }}
              >
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: color }}
                  >
                    {count}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{action}</p>
                  <p className="text-xs text-gray-600">{percentage}% of total</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
