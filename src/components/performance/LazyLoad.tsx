/**
 * @fileoverview Lazy Load Component
 * Implements lazy loading with suspense for code splitting
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-07
 */

'use client';

import { Suspense, ComponentType, lazy as reactLazy } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Lazy Load Wrapper with Suspense
 */
export function LazyLoad({ fallback, children }: LazyLoadProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 text-[#E4002B] animate-spin" />
    </div>
  );

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
}

/**
 * Lazy component loader with default loading state
 */
export function lazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = reactLazy(factory);

  return (props: React.ComponentProps<T>) => (
    <LazyLoad fallback={fallback}>
      <LazyComponent {...props} />
    </LazyLoad>
  );
}

/**
 * Loading Skeleton for lists
 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading Skeleton for cards
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading Skeleton for form
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}
