'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LazyCertificationStatusChart,
  LazyExpiryTrendChart,
  LazyPilotDistributionChart,
  LazyComplianceGaugeChart,
} from '@/components/lazy';
import { LazyLoader } from '@/components/ui/LazyLoader';
import { QuickActions } from './QuickActions';
import { useCommandPalette } from '@/components/command/CommandPaletteProvider';
import { useRealtimePilots } from '@/hooks/useRealtimePilots';
import { useRealtimeCertifications } from '@/hooks/useRealtimeCertifications';
import { Download, RefreshCw, Search } from 'lucide-react';

interface DashboardStats {
  pilots: {
    total: number;
    captains: number;
    firstOfficers: number;
    trainingCaptains: number;
    examiners: number;
  };
  certifications: {
    current: number;
    expiring: number;
    expired: number;
    total: number;
    compliance: number;
  };
  expiringCertifications: Array<{
    id: string;
    expiry_date: string;
    check_types: {
      check_code: string;
    };
  }>;
}

interface EnhancedDashboardProps {
  initialStats: DashboardStats;
  initialPilots?: any[];
  initialCertifications?: any[];
}

export function EnhancedDashboard({
  initialStats,
  initialPilots = [],
  initialCertifications = [],
}: EnhancedDashboardProps) {
  const router = useRouter();
  const { open: openCommandPalette } = useCommandPalette();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time subscriptions
  const pilotsRealtime = useRealtimePilots(initialPilots);
  const certificationsRealtime = useRealtimeCertifications(initialCertifications);

  // Use real-time data if available, fallback to initial
  const pilots = pilotsRealtime.data.length > 0 ? pilotsRealtime.data : initialPilots;
  const certifications =
    certificationsRealtime.data.length > 0 ? certificationsRealtime.data : initialCertifications;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger page reload to fetch fresh data
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExportData = () => {
    // Implement export functionality
    const dataStr = JSON.stringify(initialStats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fleet Analytics Dashboard</h2>
          <p className="text-gray-600">Interactive charts and real-time insights</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status Indicators */}
          <div className="flex items-center gap-2">
            <div
              className={`connection-indicator ${
                pilotsRealtime.connectionState === 'connected'
                  ? 'connected'
                  : pilotsRealtime.connectionState === 'connecting'
                    ? 'connecting'
                    : 'disconnected'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current animate-pulse-slow" />
              <span>Pilots</span>
            </div>

            <div
              className={`connection-indicator ${
                certificationsRealtime.connectionState === 'connected'
                  ? 'connected'
                  : certificationsRealtime.connectionState === 'connecting'
                    ? 'connecting'
                    : 'disconnected'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current animate-pulse-slow" />
              <span>Certs</span>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={openCommandPalette}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Open command palette (Cmd/Ctrl+K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-block px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#E4002B] rounded-lg hover:bg-[#C00020] transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-600 mt-1">Frequently used operations</p>
          </div>
          <div className="text-xs text-gray-500">
            Use <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded">Cmd+K</kbd> to
            search
          </div>
        </div>

        <QuickActions
          onAddPilot={() => router.push('/dashboard/pilots?action=add')}
          onAddCertification={() => router.push('/dashboard/certifications?action=add')}
          onCreateLeaveRequest={() => router.push('/dashboard/leave?action=create')}
          onViewExpiring={() => router.push('/dashboard/certifications?filter=expiring')}
          onGenerateReport={() => router.push('/dashboard/reports')}
          onBulkUpdate={() => router.push('/dashboard/certifications/bulk')}
        />
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certification Status Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Certification Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                Distribution of {initialStats.certifications.total} certifications
              </p>
            </div>
            <span className="text-2xl">📊</span>
          </div>
          <LazyLoader type="chart">
            <LazyCertificationStatusChart
              current={initialStats.certifications.current}
              expiring={initialStats.certifications.expiring}
              expired={initialStats.certifications.expired}
            />
          </LazyLoader>
        </div>

        {/* Compliance Gauge Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fleet Compliance</h3>
              <p className="text-sm text-gray-600 mt-1">Overall certification compliance rate</p>
            </div>
            <span className="text-2xl">🎯</span>
          </div>
          <LazyLoader type="chart">
            <LazyComplianceGaugeChart complianceRate={initialStats.certifications.compliance} />
          </LazyLoader>
        </div>

        {/* Expiry Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Expiry Trend</h3>
              <p className="text-sm text-gray-600 mt-1">12-month certification expiry forecast</p>
            </div>
            <span className="text-2xl">📈</span>
          </div>
          <LazyLoader type="chart">
            <LazyExpiryTrendChart expiringCertifications={initialStats.expiringCertifications} />
          </LazyLoader>
        </div>

        {/* Pilot Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pilot Distribution</h3>
              <p className="text-sm text-gray-600 mt-1">Breakdown by role and qualification</p>
            </div>
            <span className="text-2xl">👨‍✈️</span>
          </div>
          <LazyLoader type="chart">
            <LazyPilotDistributionChart
              captains={initialStats.pilots.captains}
              firstOfficers={initialStats.pilots.firstOfficers}
              trainingCaptains={initialStats.pilots.trainingCaptains}
              examiners={initialStats.pilots.examiners}
            />
          </LazyLoader>
        </div>
      </div>

      {/* Real-time Update Notification */}
      {(certificationsRealtime.lastUpdate ||
        pilotsRealtime.data.length !== initialPilots.length) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-slow" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">
                Real-time data updated
                {certificationsRealtime.lastUpdate &&
                  ` at ${certificationsRealtime.lastUpdate.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
