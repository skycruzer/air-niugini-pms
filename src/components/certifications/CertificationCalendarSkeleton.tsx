/**
 * CERTIFICATION CALENDAR SKELETON COMPONENT (shadcn/ui)
 *
 * Displays skeleton loading state for certification calendar/timeline views.
 * Provides visual feedback while fetching expiring certifications data.
 *
 * Features:
 * - Matches calendar and timeline view modes
 * - Air Niugini branded skeleton colors
 * - WCAG 2.1 AA compliant (proper ARIA roles)
 * - Responsive design
 * - Error boundary protection
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface CertificationCalendarSkeletonProps {
  viewMode?: 'calendar' | 'timeline';
}

export function CertificationCalendarSkeleton({
  viewMode = 'calendar',
}: CertificationCalendarSkeletonProps) {
  if (viewMode === 'timeline') {
    return (
      <ErrorBoundary componentName="Certification Calendar Skeleton">
        <div className="space-y-6" role="status" aria-label="Loading certification timeline">
          {/* Timeline filters skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-48 bg-gray-200" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 bg-gray-200" />
                <Skeleton className="h-9 w-24 bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Timeline events skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  {/* Date marker */}
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-12 w-12 rounded-lg bg-gray-200 mb-2" />
                    <Skeleton className="h-3 w-16 bg-gray-200" />
                  </div>

                  {/* Event details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Skeleton className="h-5 w-48 bg-gray-200" />
                      <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                    </div>
                    <Skeleton className="h-4 w-64 mb-2 bg-gray-200" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-32 bg-gray-200" />
                      <Skeleton className="h-4 w-28 bg-gray-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary componentName="Certification Calendar Skeleton">
      <div className="space-y-6" role="status" aria-label="Loading certification calendar">
        {/* Calendar header skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded bg-gray-200" />
              <Skeleton className="h-6 w-40 bg-gray-200" />
              <Skeleton className="h-9 w-9 rounded bg-gray-200" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 bg-gray-200" />
              <Skeleton className="h-9 w-24 bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Calendar grid skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
              <Skeleton key={i} className="h-6 w-full bg-gray-200" />
            ))}
          </div>

          {/* Calendar days grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="aspect-square">
                <Skeleton className="h-full w-full rounded-lg bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Skeleton className="h-5 w-32 mb-3 bg-gray-200" />
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded bg-red-200" />
              <Skeleton className="h-4 w-16 bg-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded bg-yellow-200" />
              <Skeleton className="h-4 w-24 bg-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded bg-blue-200" />
              <Skeleton className="h-4 w-20 bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Upcoming events summary skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Skeleton className="h-6 w-48 mb-4 bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-gray-200 pb-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                  <div>
                    <Skeleton className="h-4 w-40 mb-2 bg-gray-200" />
                    <Skeleton className="h-3 w-32 bg-gray-200" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
