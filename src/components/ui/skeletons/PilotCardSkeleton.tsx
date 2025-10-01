/**
 * Pilot Card Skeleton Loader
 * Displays loading state for pilot cards with Air Niugini branding
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function PilotCardSkeleton() {
  return (
    <Card className="p-6 space-y-4 animate-pulse">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <Skeleton className="h-14 w-14 rounded-full bg-air-niugini-red/10" />

          {/* Name and Employee ID */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-air-niugini-red/10" />
            <Skeleton className="h-4 w-24 bg-neutral-200" />
          </div>
        </div>

        {/* Actions Skeleton */}
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-9 rounded-md bg-neutral-200" />
          <Skeleton className="h-9 w-9 rounded-md bg-neutral-200" />
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-3 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 bg-neutral-200" />
          <Skeleton className="h-5 w-28 bg-neutral-200" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 bg-neutral-200" />
          <Skeleton className="h-5 w-32 bg-neutral-200" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20 bg-neutral-200" />
          <Skeleton className="h-5 w-20 bg-neutral-200" />
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex space-x-2 pt-4 border-t border-neutral-200">
        <Skeleton className="h-6 w-24 rounded-full bg-air-niugini-gold/10" />
        <Skeleton className="h-6 w-20 rounded-full bg-neutral-200" />
      </div>
    </Card>
  );
}

export function PilotCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PilotCardSkeleton key={i} />
      ))}
    </div>
  );
}
