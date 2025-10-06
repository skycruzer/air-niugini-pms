/**
 * TanStack Query Configuration
 * Centralized query settings with optimized caching strategies
 */

import { QueryClient } from '@tanstack/react-query';

// Query stale times (how long data is considered fresh)
export const STALE_TIME = {
  INSTANT: 0, // Always refetch
  SHORT: 30 * 1000, // 30 seconds - real-time data
  MEDIUM: 2 * 60 * 1000, // 2 minutes - frequently changing data
  LONG: 5 * 60 * 1000, // 5 minutes - relatively static data
  VERY_LONG: 30 * 60 * 1000, // 30 minutes - rarely changing data
} as const;

// Cache times (how long inactive data stays in cache)
export const CACHE_TIME = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 10 * 60 * 1000, // 10 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

// Query keys with type safety
export const queryKeys = {
  // Pilot queries
  pilots: {
    all: ['pilots'] as const,
    list: () => [...queryKeys.pilots.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.pilots.all, 'detail', id] as const,
    stats: () => [...queryKeys.pilots.all, 'stats'] as const,
    withCertifications: () => [...queryKeys.pilots.all, 'with-certifications'] as const,
  },

  // Certification queries
  certifications: {
    all: ['certifications'] as const,
    list: () => [...queryKeys.certifications.all, 'list'] as const,
    expiring: (days: number) => [...queryKeys.certifications.all, 'expiring', days] as const,
    expired: () => [...queryKeys.certifications.all, 'expired'] as const,
    byPilot: (pilotId: string) => [...queryKeys.certifications.all, 'by-pilot', pilotId] as const,
    byCategory: (category: string) =>
      [...queryKeys.certifications.all, 'by-category', category] as const,
  },

  // Analytics queries
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    fleetCertifications: (timeframe: number, groupBy: string) =>
      [...queryKeys.analytics.all, 'fleet-certifications', timeframe, groupBy] as const,
    compliance: (timeRange: string) =>
      [...queryKeys.analytics.all, 'compliance', timeRange] as const,
    trends: () => [...queryKeys.analytics.all, 'trends'] as const,
  },

  // Leave requests queries
  leave: {
    all: ['leave'] as const,
    list: (filter?: string) => [...queryKeys.leave.all, 'list', filter] as const,
    stats: () => [...queryKeys.leave.all, 'stats'] as const,
    byPilot: (pilotId: string) => [...queryKeys.leave.all, 'by-pilot', pilotId] as const,
    byRoster: (roster: string) => [...queryKeys.leave.all, 'by-roster', roster] as const,
  },

  // Reports queries
  reports: {
    all: ['reports'] as const,
    generate: (type: string, params?: Record<string, any>) =>
      [...queryKeys.reports.all, 'generate', type, params] as const,
  },

  // Check types queries
  checkTypes: {
    all: ['check-types'] as const,
    list: () => [...queryKeys.checkTypes.all, 'list'] as const,
    byCategory: (category: string) =>
      [...queryKeys.checkTypes.all, 'by-category', category] as const,
  },
};

// Default query configuration
export const defaultQueryConfig = {
  queries: {
    staleTime: STALE_TIME.MEDIUM,
    cacheTime: CACHE_TIME.MEDIUM,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    retry: 0,
  },
};

// Create optimized query client
export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: defaultQueryConfig,
  });
}

// Query option presets for different data types
export const queryOptions = {
  // Real-time data (crew availability, operational status)
  realtime: {
    staleTime: STALE_TIME.SHORT,
    cacheTime: CACHE_TIME.SHORT,
    refetchInterval: 30000, // Refetch every 30s
  },

  // Frequently changing data (certifications expiring soon)
  frequent: {
    staleTime: STALE_TIME.MEDIUM,
    cacheTime: CACHE_TIME.MEDIUM,
    refetchOnWindowFocus: true,
  },

  // Static data (check types, settings)
  static: {
    staleTime: STALE_TIME.VERY_LONG,
    cacheTime: CACHE_TIME.VERY_LONG,
    refetchOnWindowFocus: false,
  },

  // Dashboard data
  dashboard: {
    staleTime: STALE_TIME.LONG,
    cacheTime: CACHE_TIME.LONG,
    refetchOnWindowFocus: true,
  },

  // Analytics data
  analytics: {
    staleTime: STALE_TIME.LONG,
    cacheTime: CACHE_TIME.VERY_LONG,
    refetchOnWindowFocus: false,
  },

  // Reports (heavy queries)
  reports: {
    staleTime: STALE_TIME.VERY_LONG,
    cacheTime: CACHE_TIME.VERY_LONG,
    refetchOnWindowFocus: false,
  },
};

// Prefetch utilities
export const prefetchQueries = {
  dashboard: async (queryClient: QueryClient) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.pilots.stats(),
        queryFn: () => fetch('/api/pilots/stats').then((res) => res.json()),
        ...queryOptions.dashboard,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.dashboard(),
        queryFn: () => fetch('/api/analytics/dashboard').then((res) => res.json()),
        ...queryOptions.dashboard,
      }),
    ]);
  },

  analytics: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.analytics.fleetCertifications(30, 'status'),
      queryFn: () =>
        fetch('/api/analytics/fleet-certifications?timeframe=30&groupBy=status').then((res) =>
          res.json()
        ),
      ...queryOptions.analytics,
    });
  },
};

// Invalidation utilities
export const invalidateQueries = {
  allPilots: (queryClient: QueryClient) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.pilots.all }),

  allCertifications: (queryClient: QueryClient) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.certifications.all }),

  allAnalytics: (queryClient: QueryClient) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),

  allLeave: (queryClient: QueryClient) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.leave.all }),

  pilotAndRelated: (queryClient: QueryClient, pilotId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pilots.detail(pilotId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.certifications.byPilot(pilotId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.leave.byPilot(pilotId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  },

  certificationAndRelated: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.certifications.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
  },
};
