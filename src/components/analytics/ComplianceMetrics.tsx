'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { CertificationStatusChart } from '@/components/shared/CertificationStatusChart';
import { ComplianceGauge } from '@/components/shared/ComplianceGauge';

interface ComplianceMetricsProps {
  timeRange: string;
}

/**
 * Compliance Metrics Component
 *
 * Features:
 * - Compliance KPIs and gauges
 * - Category breakdown
 * - Risk indicators
 * - Compliance by pilot
 * - Historical compliance trends
 */
export default function ComplianceMetrics({ timeRange }: ComplianceMetricsProps) {
  // Sample compliance data by category
  const categoryData = useMemo(
    () => [
      {
        category: 'License & Type',
        compliance: 98,
        total: 27,
        current: 26,
        expiring: 1,
        expired: 0,
      },
      { category: 'Medical', compliance: 100, total: 27, current: 27, expiring: 0, expired: 0 },
      {
        category: 'Proficiency',
        compliance: 96,
        total: 108,
        current: 104,
        expiring: 3,
        expired: 1,
      },
      { category: 'Recurrent', compliance: 94, total: 162, current: 152, expiring: 8, expired: 2 },
      { category: 'Security', compliance: 100, total: 54, current: 54, expiring: 0, expired: 0 },
      { category: 'Safety', compliance: 92, total: 81, current: 75, expiring: 4, expired: 2 },
      { category: 'Operations', compliance: 89, total: 54, current: 48, expiring: 4, expired: 2 },
      { category: 'CRM', compliance: 97, total: 27, current: 26, expiring: 1, expired: 0 },
    ],
    []
  );

  // Radar chart data for compliance across categories
  const radarData = categoryData.map((cat) => ({
    category: cat.category,
    compliance: cat.compliance,
  }));

  // Pie chart data for overall status
  const statusData = useMemo(() => {
    const totals = categoryData.reduce(
      (acc, cat) => ({
        current: acc.current + cat.current,
        expiring: acc.expiring + cat.expiring,
        expired: acc.expired + cat.expired,
      }),
      { current: 0, expiring: 0, expired: 0 }
    );

    return [
      { name: 'Current', value: totals.current, color: '#10B981' },
      { name: 'Expiring Soon', value: totals.expiring, color: '#F59E0B' },
      { name: 'Expired', value: totals.expired, color: '#EF4444' },
    ];
  }, [categoryData]);

  // Overall compliance score
  const overallCompliance = useMemo(() => {
    const total = categoryData.reduce((sum, cat) => sum + cat.total, 0);
    const current = categoryData.reduce((sum, cat) => sum + cat.current, 0);
    return ((current / total) * 100).toFixed(1);
  }, [categoryData]);

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance Score</CardTitle>
          <CardDescription>Fleet-wide compliance rating</CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceGauge
            complianceRate={parseFloat(overallCompliance)}
            variant="svg-circle"
            size="lg"
            showLabel={true}
            showStatus={false}
          />
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{statusData[0]?.value ?? 0}</div>
              <div className="text-xs text-gray-600">Current</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{statusData[1]?.value ?? 0}</div>
              <div className="text-xs text-gray-600">Expiring Soon</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{statusData[2]?.value ?? 0}</div>
              <div className="text-xs text-gray-600">Expired</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance by Category</CardTitle>
            <CardDescription>Detailed breakdown of each certification category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="compliance" fill="#E4002B" name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Radar</CardTitle>
            <CardDescription>Multi-dimensional compliance view</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Compliance"
                  dataKey="compliance"
                  stroke="#E4002B"
                  fill="#E4002B"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Overall certification status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <CertificationStatusChart
            data={{
              current: statusData[0]?.value ?? 0,
              expiring: statusData[1]?.value ?? 0,
              expired: statusData[2]?.value ?? 0,
            }}
            variant="pie"
            height={300}
            showLegend={true}
          />
        </CardContent>
      </Card>

      {/* Detailed Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Detailed compliance metrics by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((cat) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{cat.category}</span>
                    <span className="text-sm text-gray-500">
                      {cat.current}/{cat.total} certifications
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {cat.expired > 0 && (
                      <span className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {cat.expired} expired
                      </span>
                    )}
                    {cat.expiring > 0 && (
                      <span className="text-sm text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        {cat.expiring} expiring
                      </span>
                    )}
                    <span
                      className={`font-bold ${cat.compliance >= 95 ? 'text-green-600' : cat.compliance >= 90 ? 'text-amber-600' : 'text-red-600'}`}
                    >
                      {cat.compliance}%
                    </span>
                  </div>
                </div>
                <Progress value={cat.compliance} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Low Risk</p>
                <p className="text-sm text-green-700">
                  Medical and Security categories maintain 100% compliance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Medium Risk</p>
                <p className="text-sm text-amber-700">
                  Operations category has{' '}
                  {categoryData.find((c) => c.category === 'Operations')?.expiring || 0}{' '}
                  certifications expiring soon
                </p>
              </div>
            </div>
            {(statusData[2]?.value ?? 0) > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Action Required</p>
                  <p className="text-sm text-red-700">
                    {statusData[2]?.value ?? 0} expired certifications require immediate renewal
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
