/**
 * LEAVE REQUESTS SKELETON COMPONENT (shadcn/ui)
 *
 * Displays skeleton loading state for leave management page.
 * Supports multiple tabs: requests list, calendar view, availability view.
 *
 * Features:
 * - Matches actual leave page layout
 * - Air Niugini branded skeleton colors
 * - WCAG 2.1 AA compliant (proper ARIA roles)
 * - Responsive design
 * - Error boundary protection
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface LeaveRequestsSkeletonProps {
  activeTab?: 'requests' | 'calendar' | 'availability';
}

export function LeaveRequestsSkeleton({ activeTab = 'requests' }: LeaveRequestsSkeletonProps) {
  if (activeTab === 'calendar') {
    return (
      <ErrorBoundary componentName="Leave Requests Skeleton">
        <div className="space-y-6" role="status" aria-label="Loading leave calendar">
          {/* Calendar header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-48 bg-gray-200" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded bg-gray-200" />
                <Skeleton className="h-6 w-40 bg-gray-200" />
                <Skeleton className="h-9 w-9 rounded bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full bg-gray-200" />
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="aspect-square">
                  <Skeleton className="h-full w-full rounded-lg bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (activeTab === 'availability') {
    return (
      <ErrorBoundary componentName="Leave Requests Skeleton">
        <div className="space-y-6" role="status" aria-label="Loading team availability">
          {/* Availability header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <Skeleton className="h-6 w-48 mb-3 bg-gray-200" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2 bg-gray-200" />
                  <Skeleton className="h-8 w-16 bg-gray-200" />
                </div>
              ))}
            </div>
          </div>

          {/* Team roster */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-2 bg-gray-200" />
                      <Skeleton className="h-4 w-32 bg-gray-200" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-full bg-gray-200" />
                    <Skeleton className="h-8 w-24 rounded-full bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Default: requests list view
  return (
    <ErrorBoundary componentName="Leave Requests Skeleton">
      <div className="space-y-6" role="status" aria-label="Loading leave requests">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Skeleton className="h-3 w-24 mb-2 bg-gray-200" />
                  <Skeleton className="h-8 w-16 mb-1 bg-gray-200" />
                  <Skeleton className="h-3 w-32 bg-gray-200" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
              </div>
            </div>
          ))}
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Skeleton className="h-10 flex-1 bg-gray-200" />
            <Skeleton className="h-10 w-32 bg-gray-200" />
            <Skeleton className="h-10 w-32 bg-gray-200" />
            <Skeleton className="h-10 w-40 bg-gray-200" />
          </div>
        </div>

        {/* Leave requests list */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Pilot info */}
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2 bg-gray-200" />
                    <Skeleton className="h-4 w-64 mb-2 bg-gray-200" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                      <Skeleton className="h-6 w-24 rounded-full bg-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-24 rounded-lg bg-gray-200" />
                  <Skeleton className="h-9 w-24 rounded-lg bg-gray-200" />
                  <Skeleton className="h-9 w-9 rounded-lg bg-gray-200" />
                </div>
              </div>

              {/* Details row */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <Skeleton className="h-3 w-20 mb-2 bg-gray-200" />
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                </div>
                <div>
                  <Skeleton className="h-3 w-24 mb-2 bg-gray-200" />
                  <Skeleton className="h-4 w-28 bg-gray-200" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-2 bg-gray-200" />
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                </div>
                <div>
                  <Skeleton className="h-3 w-28 mb-2 bg-gray-200" />
                  <Skeleton className="h-4 w-32 bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 bg-gray-200" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg bg-gray-200" />
            <Skeleton className="h-9 w-9 rounded-lg bg-gray-200" />
            <Skeleton className="h-9 w-9 rounded-lg bg-gray-200" />
            <Skeleton className="h-9 w-24 rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
