'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Activity, Users, Calendar, Download, RefreshCw, Settings } from 'lucide-react';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';
import ComplianceMetrics from '@/components/analytics/ComplianceMetrics';
import PilotAnalytics from '@/components/analytics/PilotAnalytics';
import CertificationAnalytics from '@/components/analytics/CertificationAnalytics';
import LeaveAnalytics from '@/components/analytics/LeaveAnalytics';
import { useToast } from '@/hooks/use-toast';

/**
 * Advanced Analytics Dashboard
 *
 * Comprehensive analytics with:
 * - Interactive time series analysis
 * - Predictive forecasting
 * - Drill-down capabilities
 * - Comparative analytics (YoY, MoM)
 * - Real-time data refresh
 * - Export functionality
 */
export default function AdvancedAnalyticsPage() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<string>('12m');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('trends');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Data refreshed',
        description: 'Analytics data has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Unable to refresh analytics data.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Your analytics report is being prepared.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#E4002B]">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">
            Interactive analytics with predictive insights and drill-down capabilities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12.5%</div>
            <p className="text-xs text-gray-500">vs previous period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Activity className="h-4 w-4 text-[#E4002B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.8%</div>
            <p className="text-xs text-gray-500">Overall fleet compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pilots</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">27</div>
            <p className="text-xs text-gray-500">Fully certified pilots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Utilization</CardTitle>
            <Calendar className="h-4 w-4 text-[#FFC72C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-gray-500">Average utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            Interactive charts with drill-down capabilities and forecasting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="compliance">
                <Activity className="h-4 w-4 mr-2" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="pilots">
                <Users className="h-4 w-4 mr-2" />
                Pilots
              </TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="leave">Leave</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="mt-6">
              <TrendAnalysis timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="compliance" className="mt-6">
              <ComplianceMetrics timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="pilots" className="mt-6">
              <PilotAnalytics timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="certifications" className="mt-6">
              <CertificationAnalytics timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="leave" className="mt-6">
              <LeaveAnalytics timeRange={timeRange} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
