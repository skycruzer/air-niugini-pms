/**
 * Pilot List Skeleton Loader
 * Displays loading state for pilot list view with table format
 */

import { Skeleton } from '@/components/ui/skeleton';

export function PilotListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-neutral-200 animate-pulse">
      {/* Left Section - Pilot Info */}
      <div className="flex items-center space-x-4 flex-1">
        {/* Avatar */}
        <Skeleton className="h-10 w-10 rounded-full bg-air-niugini-red/10" />

        {/* Name and Details */}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40 bg-air-niugini-red/10" />
          <Skeleton className="h-4 w-32 bg-neutral-200" />
        </div>
      </div>

      {/* Middle Section - Role and Status */}
      <div className="hidden md:flex items-center space-x-6 flex-1">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 bg-neutral-200" />
          <Skeleton className="h-5 w-24 bg-neutral-200" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-neutral-200" />
          <Skeleton className="h-6 w-20 rounded-full bg-air-niugini-gold/10" />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-9 w-20 rounded-md bg-neutral-200" />
        <Skeleton className="h-9 w-9 rounded-md bg-neutral-200" />
      </div>
    </div>
  );
}

export function PilotListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Table Header Skeleton */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1">
            <Skeleton className="h-4 w-24 bg-neutral-300" />
            <Skeleton className="h-4 w-20 bg-neutral-300 hidden md:block" />
            <Skeleton className="h-4 w-24 bg-neutral-300 hidden md:block" />
          </div>
          <Skeleton className="h-4 w-16 bg-neutral-300" />
        </div>
      </div>

      {/* List Items */}
      {Array.from({ length: count }).map((_, i) => (
        <PilotListItemSkeleton key={i} />
      ))}
    </div>
  );
}
