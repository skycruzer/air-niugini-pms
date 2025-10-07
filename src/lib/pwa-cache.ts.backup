/**
 * PWA Cache Management
 * Handles Service Worker cache warming, invalidation, and versioning
 * Ensures critical data is available offline
 */

import { QueryClient } from '@tanstack/react-query';

// Cache version - increment when schema changes
export const CACHE_VERSION = 'v1.0.0';
const CACHE_VERSION_KEY = 'an-pms-cache-version';

// Critical routes to pre-cache
export const CRITICAL_ROUTES = [
  '/dashboard',
  '/dashboard/pilots',
  '/dashboard/certifications',
  '/dashboard/leave',
  '/dashboard/analytics',
  '/dashboard/reports',
];

// Critical queries to pre-fetch
export const CRITICAL_QUERIES = [
  'pilots',
  'check-types',
  'dashboard-stats',
  'expiring-certifications',
  'settings',
];

/**
 * Check if cache version has changed
 */
export function hasCacheVersionChanged(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    return storedVersion !== CACHE_VERSION;
  } catch (error) {
    console.error('Error checking cache version:', error);
    return false;
  }
}

/**
 * Update stored cache version
 */
export function updateCacheVersion(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
  } catch (error) {
    console.error('Error updating cache version:', error);
  }
}

/**
 * Clear all caches (React Query + Service Worker)
 */
export async function clearAllCaches(queryClient: QueryClient): Promise<void> {
  console.log('Clearing all caches...');

  // Clear React Query cache
  queryClient.clear();

  // Clear Service Worker caches
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      console.log('Service Worker caches cleared');
    } catch (error) {
      console.error('Error clearing Service Worker caches:', error);
    }
  }

  // Clear localStorage (except user preferences)
  if (typeof window !== 'undefined') {
    try {
      const keysToKeep = ['theme', 'sidebar-collapsed', 'user-preferences'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      console.log('LocalStorage cleared (preserved user preferences)');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // Update cache version
  updateCacheVersion();
}

/**
 * Warm cache with critical data
 * Pre-fetches essential queries for offline use
 */
export async function warmCache(queryClient: QueryClient): Promise<void> {
  if (!navigator.onLine) {
    console.log('Offline - skipping cache warming');
    return;
  }

  console.log('Warming cache with critical data...');

  try {
    // Pre-fetch critical queries in parallel
    await Promise.allSettled([
      // Pilots list
      queryClient.prefetchQuery({
        queryKey: ['pilots'],
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

      // Check types (rarely changes)
      queryClient.prefetchQuery({
        queryKey: ['check-types'],
        staleTime: 60 * 60 * 1000, // 1 hour
      }),

      // Dashboard stats
      queryClient.prefetchQuery({
        queryKey: ['dashboard-stats'],
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

      // Expiring certifications
      queryClient.prefetchQuery({
        queryKey: ['expiring-certifications', 60],
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

      // Settings (rarely changes)
      queryClient.prefetchQuery({
        queryKey: ['settings'],
        staleTime: 60 * 60 * 1000, // 1 hour
      }),
    ]);

    console.log('Cache warming completed');
  } catch (error) {
    console.error('Error warming cache:', error);
  }
}

/**
 * Pre-cache critical routes in Service Worker
 */
export async function precacheRoutes(): Promise<void> {
  if (!('caches' in window) || !navigator.onLine) {
    return;
  }

  try {
    const cache = await caches.open(`pages-${CACHE_VERSION}`);

    // Pre-cache critical routes
    await Promise.allSettled(
      CRITICAL_ROUTES.map((route) =>
        cache.add(route).catch((err) => {
          console.warn(`Failed to cache route ${route}:`, err);
        })
      )
    );

    console.log('Critical routes pre-cached');
  } catch (error) {
    console.error('Error pre-caching routes:', error);
  }
}

/**
 * Invalidate stale caches
 * Removes old cache versions
 */
export async function invalidateStaleCaches(): Promise<void> {
  if (!('caches' in window)) return;

  try {
    const cacheNames = await caches.keys();
    const currentCacheNames = [
      `pages-${CACHE_VERSION}`,
      `api-cache`,
      `dashboard-cache`,
      `supabase-api-cache`,
      `data-cache`,
      `static-js-assets`,
      `static-style-assets`,
      `static-image-assets`,
      `static-font-assets`,
      `google-fonts`,
    ];

    // Delete old version caches
    await Promise.all(
      cacheNames
        .filter(
          (cacheName) =>
            !currentCacheNames.includes(cacheName) && !cacheName.includes(CACHE_VERSION)
        )
        .map((cacheName) => {
          console.log(`Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
    );

    console.log('Stale caches invalidated');
  } catch (error) {
    console.error('Error invalidating stale caches:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  reactQuery: number;
  serviceWorker: number;
  localStorage: number;
}> {
  const stats = {
    reactQuery: 0,
    serviceWorker: 0,
    localStorage: 0,
  };

  // React Query cache size (approximate)
  if (typeof window !== 'undefined') {
    try {
      const queryCache = JSON.stringify(
        window.localStorage.getItem('REACT_QUERY_OFFLINE_CACHE') || '{}'
      );
      stats.reactQuery = new Blob([queryCache]).size;
    } catch (error) {
      console.error('Error calculating React Query cache size:', error);
    }
  }

  // Service Worker cache size
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        stats.serviceWorker += requests.length;
      }
    } catch (error) {
      console.error('Error calculating Service Worker cache size:', error);
    }
  }

  // LocalStorage size (approximate)
  if (typeof window !== 'undefined') {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      stats.localStorage = total;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
    }
  }

  return stats;
}

/**
 * Initialize cache management
 * Call this on app startup
 */
export async function initializeCacheManagement(queryClient: QueryClient): Promise<void> {
  console.log('Initializing PWA cache management...');

  // Check if cache version changed
  if (hasCacheVersionChanged()) {
    console.log('Cache version changed - clearing old caches');
    await clearAllCaches(queryClient);
  }

  // Invalidate stale caches
  await invalidateStaleCaches();

  // Warm cache with critical data
  await warmCache(queryClient);

  // Pre-cache critical routes
  await precacheRoutes();

  console.log('PWA cache management initialized');
}

/**
 * Setup periodic cache cleanup
 * Runs every 30 minutes
 */
export function setupPeriodicCacheCleanup(queryClient: QueryClient): void {
  if (typeof window === 'undefined') return;

  // Run cleanup every 30 minutes
  const interval = setInterval(
    async () => {
      console.log('Running periodic cache cleanup...');
      await invalidateStaleCaches();
    },
    30 * 60 * 1000
  );

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
}

/**
 * Get cached query data
 * Useful for offline fallbacks
 */
export function getCachedQueryData<T>(queryClient: QueryClient, queryKey: any[]): T | undefined {
  return queryClient.getQueryData<T>(queryKey);
}

/**
 * Check if query data exists in cache
 */
export function hasQueryCache(queryClient: QueryClient, queryKey: any[]): boolean {
  return queryClient.getQueryData(queryKey) !== undefined;
}

/**
 * Get last update time for a query
 */
export function getQueryLastUpdate(queryClient: QueryClient, queryKey: any[]): Date | null {
  const state = queryClient.getQueryState(queryKey);
  return state?.dataUpdatedAt ? new Date(state.dataUpdatedAt) : null;
}

/**
 * Manual cache invalidation for specific resource
 */
export async function invalidateResource(
  queryClient: QueryClient,
  resource: 'pilots' | 'certifications' | 'leave' | 'all'
): Promise<void> {
  console.log(`Invalidating ${resource} cache...`);

  switch (resource) {
    case 'pilots':
      await queryClient.invalidateQueries({ queryKey: ['pilots'] });
      await queryClient.invalidateQueries({ queryKey: ['pilot'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      break;

    case 'certifications':
      await queryClient.invalidateQueries({ queryKey: ['pilot-checks'] });
      await queryClient.invalidateQueries({ queryKey: ['expiring-certifications'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      break;

    case 'leave':
      await queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      break;

    case 'all':
      await queryClient.invalidateQueries();
      break;
  }

  console.log(`${resource} cache invalidated`);
}
