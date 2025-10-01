/**
 * Certification Table Skeleton Loader
 * Displays loading state for certification tables and views
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function CertificationTableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-neutral-200 animate-pulse">
      {/* Check Code */}
      <div className="flex-1">
        <Skeleton className="h-4 w-24 bg-air-niugini-red/10" />
      </div>

      {/* Description */}
      <div className="flex-1 hidden md:block">
        <Skeleton className="h-4 w-48 bg-neutral-200" />
      </div>

      {/* Category */}
      <div className="flex-1 hidden lg:block">
        <Skeleton className="h-6 w-28 rounded-full bg-air-niugini-gold/10" />
      </div>

      {/* Expiry Date */}
      <div className="flex-1">
        <Skeleton className="h-4 w-32 bg-neutral-200" />
      </div>

      {/* Status */}
      <div className="flex-1">
        <Skeleton className="h-6 w-24 rounded-full bg-neutral-200" />
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-9 w-9 rounded-md bg-neutral-200" />
      </div>
    </div>
  );
}

export function CertificationTableSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Card className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <Skeleton className="h-4 w-20 bg-neutral-300" />
            <Skeleton className="h-4 w-32 bg-neutral-300 hidden md:block" />
            <Skeleton className="h-4 w-24 bg-neutral-300 hidden lg:block" />
            <Skeleton className="h-4 w-28 bg-neutral-300" />
            <Skeleton className="h-4 w-20 bg-neutral-300" />
          </div>
          <Skeleton className="h-4 w-16 bg-neutral-300" />
        </div>
      </div>

      {/* Table Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <CertificationTableRowSkeleton key={i} />
      ))}
    </Card>
  );
}

export function CertificationCardSkeleton() {
  return (
    <Card className="p-6 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-neutral-200">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 bg-air-niugini-red/10" />
          <Skeleton className="h-4 w-48 bg-neutral-200" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full bg-air-niugini-gold/10" />
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 bg-neutral-200" />
          <Skeleton className="h-4 w-32 bg-neutral-200" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 bg-neutral-200" />
          <Skeleton className="h-6 w-24 rounded-full bg-neutral-200" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 bg-neutral-200" />
          <Skeleton className="h-4 w-20 bg-neutral-200" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-neutral-200">
        <Skeleton className="h-9 w-24 rounded-md bg-neutral-200" />
        <Skeleton className="h-9 w-24 rounded-md bg-neutral-200" />
      </div>
    </Card>
  );
}

export function CertificationCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CertificationCardSkeleton key={i} />
      ))}
    </div>
  );
}
