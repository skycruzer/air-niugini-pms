/**
 * @fileoverview Cache Warm-up Utility for Next.js Application
 * Provides cache initialization for optimal performance on application startup.
 * Should be called once during application bootstrap to pre-load frequently accessed data.
 */

import { cacheService } from '@/lib/cache-service';

/**
 * Global flag to ensure cache warm-up runs only once
 */
let isWarmUpComplete = false;

/**
 * Initialize cache warm-up for optimal application performance
 * This function runs non-blocking to avoid delaying UI rendering
 *
 * @returns {void} Executes in background without blocking
 */
export function initializeCacheWarmUp(): void {
  // Prevent multiple warm-up attempts
  if (isWarmUpComplete) {
    console.log('🔥 Cache already warmed up, skipping...');
    return;
  }

  // Run cache warm-up in background without blocking UI
  setTimeout(async () => {
    try {
      console.log('🚀 Starting non-blocking cache warm-up process...');

      // Warm up the cache with frequently accessed data
      await cacheService.warmUp();

      isWarmUpComplete = true;
      console.log('✅ Background cache warm-up completed successfully');
    } catch (error) {
      console.warn('⚠️ Background cache warm-up failed, but application will continue:', error);
      // Don't throw error - application should work without cache
    }
  }, 100); // Small delay to ensure UI renders first
}

/**
 * Get cache statistics for monitoring
 * Useful for debugging and performance monitoring
 *
 * @returns {object} Current cache statistics
 */
export function getCacheStats(): object {
  return cacheService.getStats();
}

/**
 * Manual cache refresh function
 * Can be used for administrative purposes or periodic refresh
 *
 * @returns {Promise<void>} Resolves when cache refresh is complete
 */
export async function refreshCache(): Promise<void> {
  try {
    console.log('🔄 Manual cache refresh initiated...');

    // Clear existing cache
    cacheService.invalidateAll();

    // Warm up with fresh data
    await cacheService.warmUp();

    console.log('✅ Manual cache refresh completed');
  } catch (error) {
    console.error('❌ Manual cache refresh failed:', error);
    throw error;
  }
}
