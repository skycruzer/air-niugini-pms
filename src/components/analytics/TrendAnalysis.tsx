'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Download } from 'lucide-react';

interface TrendAnalysisProps {
  timeRange: string;
}

/**
 * Trend Analysis Component
 *
 * Features:
 * - Time series visualization
 * - Predictive forecasting
 * - Comparative analytics (YoY, MoM)
 * - Trend indicators
 * - Interactive drill-down
 */
export default function TrendAnalysis({ timeRange }: TrendAnalysisProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [showForecast, setShowForecast] = useState(true);

  // Generate sample data with forecast
  const data = useMemo(() => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const historical = months.slice(0, 10).map((month, index) => ({
      month,
      compliance: 92 + Math.random() * 8,
      certifications: 520 + Math.random() * 50,
      pilots: 25 + Math.floor(Math.random() * 3),
      forecast: null,
    }));

    // Add forecast data
    const forecast = months.slice(10, 12).map((month) => ({
      month,
      compliance: null,
      certifications: null,
      pilots: null,
      forecast: 95 + Math.random() * 3,
    }));

    return [...historical, ...forecast];
  }, [timeRange]);

  // Calculate trends
  const trends = useMemo(() => {
    const complianceData = data.filter((d) => d.compliance !== null).map((d) => d.compliance!);
    const recentAvg = complianceData.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousAvg = complianceData.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    return {
      compliance: {
        value: recentAvg.toFixed(1),
        change: change.toFixed(1),
        trend: change > 0 ? 'up' : 'down',
      },
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Trend Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{trends.compliance.value}%</div>
                <p className="text-xs text-gray-500">Current average</p>
              </div>
              <div
                className={`flex items-center ${trends.compliance.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
              >
                {trends.compliance.trend === 'up' ? (
                  <TrendingUp className="h-5 w-5 mr-1" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-1" />
                )}
                <span className="font-semibold">
                  {Math.abs(parseFloat(trends.compliance.change))}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Forecast Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-gray-500">Model accuracy</p>
              </div>
              <Activity className="h-5 w-5 text-[#E4002B]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projected Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">+2.5%</div>
                <p className="text-xs text-gray-500">Next quarter</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
            className={chartType === 'line' ? 'bg-[#E4002B] hover:bg-[#C00020]' : ''}
          >
            Line Chart
          </Button>
          <Button
            variant={chartType === 'area' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('area')}
            className={chartType === 'area' ? 'bg-[#E4002B] hover:bg-[#C00020]' : ''}
          >
            Area Chart
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowForecast(!showForecast)}>
            {showForecast ? 'Hide' : 'Show'} Forecast
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Trend Analysis</CardTitle>
          <CardDescription>Historical data with predictive forecasting</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  stroke="#E4002B"
                  strokeWidth={2}
                  name="Compliance Rate"
                  dot={{ r: 4 }}
                />
                {showForecast && (
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#FFC72C"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={{ r: 4 }}
                  />
                )}
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="#E4002B"
                  fill="#E4002B"
                  fillOpacity={0.3}
                  name="Compliance Rate"
                />
                {showForecast && (
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke="#FFC72C"
                    fill="#FFC72C"
                    fillOpacity={0.2}
                    strokeDasharray="5 5"
                    name="Forecast"
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Certification Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Volume Trend</CardTitle>
          <CardDescription>Total certifications over time with growth indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.filter((d) => d.certifications !== null)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="certifications"
                stroke="#4F46E5"
                fill="#4F46E5"
                fillOpacity={0.3}
                name="Total Certifications"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Positive Trend</p>
                <p className="text-sm text-green-700">
                  Compliance rate has improved by {Math.abs(parseFloat(trends.compliance.change))}%
                  over the last quarter
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Forecast Accuracy</p>
                <p className="text-sm text-blue-700">
                  Our predictive model shows 87% accuracy based on historical patterns
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Activity className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Seasonal Pattern</p>
                <p className="text-sm text-amber-700">
                  Data shows consistent seasonal patterns with Q1 and Q3 peaks
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
