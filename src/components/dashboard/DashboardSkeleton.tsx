/**
 * DASHBOARD SKELETON COMPONENT (shadcn/ui)
 *
 * Displays skeleton loading state for dashboard page while data is fetching.
 * Matches the actual dashboard layout with statistics cards and charts.
 *
 * Features:
 * - Air Niugini branded skeleton colors
 * - Responsive layout matching actual dashboard
 * - WCAG 2.1 AA compliant (proper ARIA roles)
 * - Smooth loading animation
 * - Error boundary protection
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function DashboardSkeleton() {
  return (
    <ErrorBoundary componentName="Dashboard Skeleton">
      <div className="space-y-6 md:space-y-8">
        {/* Header section skeleton */}
        <div
          className="bg-white rounded-lg border border-gray-200 p-4 md:p-6"
          role="status"
          aria-label="Loading dashboard"
        >
          <Skeleton className="h-8 w-48 mb-2 bg-gray-200" />
          <Skeleton className="h-4 w-64 bg-gray-200" />
        </div>

        {/* Roster period skeleton */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-2 border-blue-200 rounded-lg p-4 md:p-6">
          <Skeleton className="h-6 w-40 mb-3 bg-blue-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2 bg-blue-200" />
              <Skeleton className="h-6 w-32 bg-blue-200" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2 bg-blue-200" />
              <Skeleton className="h-6 w-36 bg-blue-200" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2 bg-blue-200" />
              <Skeleton className="h-6 w-40 bg-blue-200" />
            </div>
          </div>
        </div>

        {/* Statistics cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Stat card 1 */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-2 border-blue-200 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-3 w-24 mb-2 bg-blue-200" />
                <Skeleton className="h-8 w-16 mb-1 bg-blue-200" />
                <Skeleton className="h-4 w-32 bg-blue-200" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl bg-blue-300" />
            </div>
          </div>

          {/* Stat card 2 */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 border-2 border-green-200 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-3 w-28 mb-2 bg-green-200" />
                <Skeleton className="h-8 w-20 mb-1 bg-green-200" />
                <Skeleton className="h-4 w-36 bg-green-200" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl bg-green-300" />
            </div>
          </div>

          {/* Stat card 3 */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/20 border-2 border-amber-200 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-3 w-32 mb-2 bg-amber-200" />
                <Skeleton className="h-8 w-24 mb-1 bg-amber-200" />
                <Skeleton className="h-4 w-28 bg-amber-200" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl bg-amber-300" />
            </div>
          </div>

          {/* Stat card 4 */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/20 border-2 border-red-200 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-3 w-24 mb-2 bg-red-200" />
                <Skeleton className="h-8 w-16 mb-1 bg-red-200" />
                <Skeleton className="h-4 w-32 bg-red-200" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl bg-red-300" />
            </div>
          </div>
        </div>

        {/* Secondary stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 border-2 border-purple-200 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-3 w-32 mb-2 bg-purple-200" />
                <Skeleton className="h-8 w-20 bg-purple-200" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl bg-purple-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 border-2 border-indigo-200 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-3 w-28 mb-2 bg-indigo-200" />
                <Skeleton className="h-8 w-16 bg-indigo-200" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl bg-indigo-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-2 border-blue-200 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-3 w-24 mb-2 bg-blue-200" />
                <Skeleton className="h-8 w-24 bg-blue-200" />
              </div>
              <Skeleton className="h-14 w-14 rounded-2xl bg-blue-300" />
            </div>
          </div>
        </div>

        {/* Charts section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Skeleton className="h-6 w-48 mb-4 bg-gray-200" />
            <Skeleton className="h-64 w-full bg-gray-200 rounded" />
          </div>

          {/* Chart 2 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Skeleton className="h-6 w-40 mb-4 bg-gray-200" />
            <Skeleton className="h-64 w-full bg-gray-200 rounded" />
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-6 w-32 mb-4 bg-gray-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                  <Skeleton className="h-5 w-24 ml-3 bg-gray-200" />
                </div>
                <Skeleton className="h-4 w-full mb-2 bg-gray-200" />
                <Skeleton className="h-4 w-3/4 bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-6 w-36 mb-4 bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-gray-200 pb-3"
              >
                <div className="flex items-center flex-1">
                  <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-4 w-48 mb-2 bg-gray-200" />
                    <Skeleton className="h-3 w-32 bg-gray-200" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20 bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
