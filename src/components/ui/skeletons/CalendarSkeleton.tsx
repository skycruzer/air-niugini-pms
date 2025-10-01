/**
 * Calendar Skeleton Loader
 * Displays loading state for calendar views and date pickers
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function CalendarDaySkeleton() {
  return (
    <div className="p-2 text-center animate-pulse">
      <Skeleton className="h-8 w-8 mx-auto rounded-md bg-neutral-200" />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <Card className="p-6 space-y-4 animate-pulse">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <Skeleton className="h-9 w-9 rounded-md bg-neutral-200" />
        <Skeleton className="h-6 w-40 bg-air-niugini-red/10" />
        <Skeleton className="h-9 w-9 rounded-md bg-neutral-200" />
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-4 w-8 mx-auto bg-neutral-300" />
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <CalendarDaySkeleton key={i} />
        ))}
      </div>

      {/* Calendar Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <Skeleton className="h-9 w-24 rounded-md bg-neutral-200" />
        <Skeleton className="h-9 w-28 rounded-md bg-air-niugini-red/10" />
      </div>
    </Card>
  );
}

export function LeaveCalendarSkeleton() {
  return (
    <Card className="p-6 space-y-6 animate-pulse">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-40 rounded-md bg-air-niugini-red/10" />
          <Skeleton className="h-10 w-32 rounded-md bg-neutral-200" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-32 rounded-md bg-neutral-200" />
          <Skeleton className="h-10 w-10 rounded-md bg-neutral-200" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-4">
        {/* Month Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <Skeleton className="h-6 w-32 bg-air-niugini-gold/10" />
          <Skeleton className="h-5 w-24 bg-neutral-200" />
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-10 mx-auto bg-neutral-300" />
            </div>
          ))}
        </div>

        {/* Calendar Days with Events */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="p-2 space-y-1">
              <Skeleton className="h-6 w-6 rounded-md bg-neutral-200" />
              {Math.random() > 0.7 && (
                <Skeleton className="h-2 w-full rounded-full bg-air-niugini-gold/20" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 pt-4 border-t border-neutral-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-full bg-neutral-200" />
            <Skeleton className="h-4 w-20 bg-neutral-200" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CertificationCalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-air-niugini-red/10" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-24 rounded-md bg-neutral-200" />
          <Skeleton className="h-10 w-10 rounded-md bg-neutral-200" />
          <Skeleton className="h-10 w-10 rounded-md bg-neutral-200" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-4 animate-pulse">
            {/* Month Header */}
            <div className="text-center pb-2 border-b border-neutral-200">
              <Skeleton className="h-5 w-32 mx-auto bg-air-niugini-gold/10" />
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="text-center">
                  <Skeleton className="h-3 w-6 mx-auto bg-neutral-300" />
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, j) => (
                <div key={j} className="p-1">
                  <Skeleton className="h-8 w-8 rounded-md bg-neutral-200" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Upcoming Expiries */}
      <Card className="p-6 space-y-4 animate-pulse">
        <Skeleton className="h-5 w-40 bg-air-niugini-red/10" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full bg-air-niugini-gold/10" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-neutral-200" />
                  <Skeleton className="h-3 w-24 bg-neutral-200" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-neutral-200" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
