'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';

interface LeaveAnalyticsProps {
  timeRange: string;
}

export default function LeaveAnalytics({ timeRange }: LeaveAnalyticsProps) {
  const leaveMetrics = useMemo(() => ({
    totalRequests: 142,
    approved: 128,
    pending: 8,
    rejected: 6,
    utilizationRate: 68,
    avgDuration: 5.2,
  }), []);

  const leaveByType = useMemo(() => [
    { type: 'RDO', count: 85, color: '#E4002B' },
    { type: 'WDO', count: 32, color: '#4F46E5' },
    { type: 'Annual', count: 25, color: '#10B981' },
  ], []);

  const leaveTrend = useMemo(() => [
    { month: 'Jan', rdo: 12, wdo: 4, annual: 3 },
    { month: 'Feb', rdo: 10, wdo: 3, annual: 2 },
    { month: 'Mar', rdo: 11, wdo: 5, annual: 4 },
    { month: 'Apr', rdo: 13, wdo: 4, annual: 3 },
    { month: 'May', rdo: 9, wdo: 2, annual: 2 },
    { month: 'Jun', rdo: 14, wdo: 6, annual: 5 },
    { month: 'Jul', rdo: 8, wdo: 3, annual: 2 },
    { month: 'Aug', rdo: 8, wdo: 5, annual: 4 },
  ], []);

  const utilizationByPilot = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      pilot: `Pilot ${i + 1}`,
      utilization: 50 + Math.floor(Math.random() * 40),
      days: 8 + Math.floor(Math.random() * 12),
    })).sort((a, b) => b.utilization - a.utilization),
  []);

  const approvalRate = useMemo(() => [
    { month: 'Jan', rate: 92 },
    { month: 'Feb', rate: 88 },
    { month: 'Mar', rate: 94 },
    { month: 'Apr', rate: 90 },
    { month: 'May', rate: 95 },
    { month: 'Jun', rate: 91 },
    { month: 'Jul', rate: 93 },
    { month: 'Aug', rate: 96 },
  ], []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveMetrics.totalRequests}</div>
            <p className="text-xs text-gray-500">{leaveMetrics.approved} approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Utilization Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveMetrics.utilizationRate}%</div>
            <p className="text-xs text-gray-500">Fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{leaveMetrics.pending}</div>
            <p className="text-xs text-gray-500">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveMetrics.avgDuration}</div>
            <p className="text-xs text-gray-500">Days per request</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Distribution</CardTitle>
            <CardDescription>Requests by leave type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count, percent }) => `${type}: ${count} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {leaveByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Rate Trend</CardTitle>
            <CardDescription>Monthly approval percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={approvalRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} name="Approval Rate %" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Trend by Type</CardTitle>
          <CardDescription>Monthly breakdown of leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={leaveTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rdo" fill="#E4002B" name="RDO" />
              <Bar dataKey="wdo" fill="#4F46E5" name="WDO" />
              <Bar dataKey="annual" fill="#10B981" name="Annual Leave" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utilization by Pilot</CardTitle>
          <CardDescription>Top 10 pilots by leave utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={utilizationByPilot} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="pilot" type="category" width={70} />
              <Tooltip />
              <Bar dataKey="utilization" name="Utilization %">
                {utilizationByPilot.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.utilization >= 80 ? '#EF4444' : entry.utilization >= 60 ? '#F59E0B' : '#10B981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
