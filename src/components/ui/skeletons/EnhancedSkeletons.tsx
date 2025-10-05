/**
 * @fileoverview Enhanced Skeleton Components
 * Improved skeleton screens with better animations and layouts
 */

import React from 'react';

// Base skeleton with shimmer effect
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 2s ease-in-out infinite',
      }}
      {...props}
    />
  );
}

// Dashboard cards skeleton
export function DashboardCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="w-14 h-14 rounded-2xl" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pilot card grid skeleton
export function PilotCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// List view skeleton
export function ListViewSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="h-64 flex items-end justify-around gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton
              key={i}
              className="w-full"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// Add shimmer animation to globals.css
export const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;
