/**
 * Dashboard Statistics Skeleton Loader
 * Displays loading state for dashboard stat cards
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function DashboardStatCardSkeleton() {
  return (
    <Card className="p-6 space-y-4 animate-pulse">
      {/* Icon and Title */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-neutral-200" />
          <Skeleton className="h-8 w-24 bg-air-niugini-red/10" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg bg-air-niugini-gold/10" />
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center space-x-2 pt-2 border-t border-neutral-200">
        <Skeleton className="h-4 w-4 rounded bg-neutral-200" />
        <Skeleton className="h-4 w-28 bg-neutral-200" />
      </div>
    </Card>
  );
}

export function DashboardStatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <DashboardStatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardChartSkeleton() {
  return (
    <Card className="p-6 space-y-4 animate-pulse">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 bg-air-niugini-red/10" />
          <Skeleton className="h-4 w-32 bg-neutral-200" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md bg-neutral-200" />
      </div>

      {/* Chart Body */}
      <div className="space-y-3 pt-4">
        {/* Bar chart representation */}
        <div className="flex items-end justify-between space-x-2 h-48">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 bg-air-niugini-gold/10"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-sm bg-neutral-200" />
              <Skeleton className="h-4 w-20 bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function DashboardFullPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-air-niugini-red/10" />
        <Skeleton className="h-4 w-96 bg-neutral-200" />
      </div>

      {/* Stats Grid */}
      <DashboardStatsGridSkeleton count={4} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChartSkeleton />
        <DashboardChartSkeleton />
      </div>

      {/* Recent Activity */}
      <Card className="p-6 space-y-4 animate-pulse">
        <Skeleton className="h-5 w-40 bg-air-niugini-red/10" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full bg-air-niugini-gold/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-neutral-200" />
                <Skeleton className="h-3 w-1/2 bg-neutral-200" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md bg-neutral-200" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
