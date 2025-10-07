/**
 * @fileoverview Analytics Dashboard Page for Air Niugini B767 PMS
 * Dedicated page for advanced analytics and interactive charts
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for the analytics dashboard (shadcn/ui upgraded)
function AnalyticsLoading() {
  return (
    <div
      className="p-6 max-w-7xl mx-auto space-y-6"
      role="status"
      aria-label="Loading analytics dashboard"
    >
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-1/3 mb-2 bg-gray-200" />
        <Skeleton className="h-4 w-1/2 mb-1 bg-gray-200" />
        <Skeleton className="h-3 w-1/4 bg-gray-200" />
      </div>

      {/* Filter skeleton */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 bg-gray-200" />
          <Skeleton className="h-8 w-24 bg-gray-200" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-80 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Error boundary component
function AnalyticsError() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold text-red-800 mb-2">
          Analytics Temporarily Unavailable
        </h2>
        <p className="text-red-600 mb-6">
          We're experiencing technical difficulties loading the analytics dashboard. Please try
          refreshing the page or contact support if the problem persists.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
          <a
            href="/dashboard"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<AnalyticsLoading />}>
          <AnalyticsDashboard />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Generate metadata for the page
export const metadata = {
  title: 'Analytics Dashboard - Air Niugini B767 PMS',
  description:
    'Advanced analytics and interactive charts for Air Niugini B767 fleet operations management',
};
