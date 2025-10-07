/**
 * PILOT LIST SKELETON COMPONENT (shadcn/ui)
 *
 * Displays skeleton loading state for pilot list page while data is fetching.
 * Improves perceived performance and provides better UX during async operations.
 *
 * Features:
 * - Matches card/list/table view modes
 * - Air Niugini branded skeleton colors
 * - WCAG 2.1 AA compliant (proper ARIA roles)
 * - Responsive design (mobile-first)
 * - Error boundary protection
 *
 * Usage:
 * - Display during initial data fetch
 * - Display during filter/search operations with loading state
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface PilotListSkeletonProps {
  viewMode?: 'card' | 'list' | 'table';
  count?: number;
}

export function PilotListSkeleton({ viewMode = 'card', count = 6 }: PilotListSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (viewMode === 'card') {
    return (
      <ErrorBoundary componentName="Pilot List Skeleton">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6"
              role="status"
              aria-label="Loading pilot information"
            >
              {/* Header with avatar and name */}
              <div className="flex items-start mb-4">
                <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-5 w-32 mb-2 bg-gray-200" />
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                </div>
              </div>

              {/* Role and status badges */}
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                <Skeleton className="h-6 w-16 rounded-full bg-gray-200" />
              </div>

              {/* Details grid */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 bg-gray-200" />
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                </div>
              </div>

              {/* Certification status */}
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                <Skeleton className="h-8 w-8 rounded bg-gray-200" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg bg-gray-200" />
                <Skeleton className="h-9 w-20 rounded-lg bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </ErrorBoundary>
    );
  }

  if (viewMode === 'list') {
    return (
      <ErrorBoundary componentName="Pilot List Skeleton">
        <div className="space-y-3">
          {items.map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
              role="status"
              aria-label="Loading pilot information"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-5 w-40 mb-2 bg-gray-200" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-20 bg-gray-200" />
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                  <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                  <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                  <Skeleton className="h-8 w-20 rounded-lg bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ErrorBoundary>
    );
  }

  if (viewMode === 'table') {
    return (
      <ErrorBoundary componentName="Pilot List Skeleton">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4 bg-gray-300" />
              <Skeleton className="h-4 w-32 bg-gray-300" />
              <Skeleton className="h-4 w-24 bg-gray-300" />
              <Skeleton className="h-4 w-28 bg-gray-300" />
              <Skeleton className="h-4 w-20 bg-gray-300" />
              <Skeleton className="h-4 w-24 bg-gray-300" />
            </div>
          </div>

          {/* Table rows */}
          {items.map((i) => (
            <div
              key={i}
              className="border-b border-gray-200 px-6 py-4"
              role="status"
              aria-label="Loading pilot information"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-4 bg-gray-200" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
                  <Skeleton className="h-4 w-32 bg-gray-200" />
                </div>
                <Skeleton className="h-4 w-24 bg-gray-200" />
                <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                <Skeleton className="h-4 w-20 bg-gray-200" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-6 rounded bg-gray-200" />
                  <Skeleton className="h-6 w-6 rounded bg-gray-200" />
                  <Skeleton className="h-6 w-6 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ErrorBoundary>
    );
  }

  return null;
}
