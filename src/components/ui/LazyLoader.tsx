import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  type?: 'modal' | 'chart' | 'component' | 'minimal';
}

/**
 * LazyLoader - Reusable Suspense wrapper for lazy-loaded components
 *
 * Provides consistent loading fallbacks for different component types
 * Used for code-split components to improve initial bundle size
 */
export function LazyLoader({ children, fallback, type = 'component' }: LazyLoaderProps) {
  const defaultFallback = fallback || getFallbackForType(type);

  return <Suspense fallback={defaultFallback}>{children}</Suspense>;
}

function getFallbackForType(type: LazyLoaderProps['type']) {
  switch (type) {
    case 'modal':
      return <ModalSkeleton />;
    case 'chart':
      return <ChartSkeleton />;
    case 'minimal':
      return <MinimalSkeleton />;
    case 'component':
    default:
      return <ComponentSkeleton />;
  }
}

// Modal skeleton - Full screen overlay with content skeleton
function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-pulse">
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 justify-end mt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Chart skeleton - Chart-sized loading state
function ChartSkeleton() {
  return (
    <div className="w-full h-64 flex items-center justify-center animate-pulse">
      <div className="space-y-4 w-full p-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-end gap-2 h-48">
          <Skeleton className="h-32 flex-1" />
          <Skeleton className="h-40 flex-1" />
          <Skeleton className="h-36 flex-1" />
          <Skeleton className="h-44 flex-1" />
          <Skeleton className="h-28 flex-1" />
          <Skeleton className="h-38 flex-1" />
        </div>
      </div>
    </div>
  );
}

// Component skeleton - Generic component loading
function ComponentSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

// Minimal skeleton - Just a spinner
function MinimalSkeleton() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]" />
    </div>
  );
}

// Export individual skeleton components for custom use
export { ModalSkeleton, ChartSkeleton, ComponentSkeleton, MinimalSkeleton };
