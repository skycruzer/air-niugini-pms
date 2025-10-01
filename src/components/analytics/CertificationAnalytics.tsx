'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { FileCheck, AlertCircle, Calendar, TrendingUp } from 'lucide-react';

interface CertificationAnalyticsProps {
  timeRange: string;
}

export default function CertificationAnalytics({ timeRange }: CertificationAnalyticsProps) {
  const certMetrics = useMemo(() => ({
    total: 556,
    current: 523,
    expiring: 26,
    expired: 7,
    renewalRate: 94.1,
  }), []);

  const renewalTrend = useMemo(() => [
    { month: 'Jan', renewals: 45, expirations: 42, rate: 107 },
    { month: 'Feb', renewals: 38, expirations: 40, rate: 95 },
    { month: 'Mar', renewals: 52, expirations: 48, rate: 108 },
    { month: 'Apr', renewals: 41, expirations: 38, rate: 108 },
    { month: 'May', renewals: 49, expirations: 45, rate: 109 },
    { month: 'Jun', renewals: 43, expirations: 41, rate: 105 },
    { month: 'Jul', renewals: 47, expirations: 44, rate: 107 },
    { month: 'Aug', renewals: 50, expirations: 46, rate: 109 },
    { month: 'Sep', renewals: 44, expirations: 43, rate: 102 },
  ], []);

  const categoryTrend = useMemo(() => [
    { month: 'Jan', license: 27, medical: 27, proficiency: 105, recurrent: 158 },
    { month: 'Feb', license: 27, medical: 27, proficiency: 106, recurrent: 160 },
    { month: 'Mar', license: 27, medical: 27, proficiency: 107, recurrent: 161 },
    { month: 'Apr', license: 27, medical: 27, proficiency: 107, recurrent: 162 },
    { month: 'May', license: 27, medical: 27, proficiency: 108, recurrent: 162 },
    { month: 'Jun', license: 27, medical: 27, proficiency: 108, recurrent: 162 },
  ], []);

  const expiryForecast = useMemo(() => [
    { month: 'Oct', expiring: 8, forecast: null },
    { month: 'Nov', expiring: 12, forecast: null },
    { month: 'Dec', expiring: 15, forecast: null },
    { month: 'Jan', expiring: null, forecast: 14 },
    { month: 'Feb', expiring: null, forecast: 11 },
    { month: 'Mar', expiring: null, forecast: 13 },
  ], []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Total Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certMetrics.total}</div>
            <p className="text-xs text-gray-500">{certMetrics.current} current</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{certMetrics.expiring}</div>
            <p className="text-xs text-gray-500">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-600" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{certMetrics.expired}</div>
            <p className="text-xs text-gray-500">Require renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Renewal Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{certMetrics.renewalRate}%</div>
            <p className="text-xs text-gray-500">On-time renewals</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Renewal Trend</CardTitle>
          <CardDescription>Monthly renewals vs expirations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={renewalTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="renewals" fill="#10B981" name="Renewals" />
              <Bar yAxisId="left" dataKey="expirations" fill="#EF4444" name="Expirations" />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#E4002B" strokeWidth={2} name="Renewal Rate %" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Trends</CardTitle>
          <CardDescription>Certification count by category over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={categoryTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="recurrent" stackId="1" stroke="#E4002B" fill="#E4002B" fillOpacity={0.8} name="Recurrent" />
              <Area type="monotone" dataKey="proficiency" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.8} name="Proficiency" />
              <Area type="monotone" dataKey="medical" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} name="Medical" />
              <Area type="monotone" dataKey="license" stackId="1" stroke="#FFC72C" fill="#FFC72C" fillOpacity={0.8} name="License" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expiry Forecast</CardTitle>
          <CardDescription>Predicted certification expirations (next 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={expiryForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="expiring" stroke="#E4002B" strokeWidth={2} name="Historical" dot={{ r: 5 }} />
              <Line type="monotone" dataKey="forecast" stroke="#FFC72C" strokeWidth={2} strokeDasharray="5 5" name="Forecast" dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
