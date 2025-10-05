/**
 * Report Data Cache Service
 * Provides intelligent caching for report data with configurable TTL and invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ReportDataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    this.cache.forEach(entry => {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Singleton instance
export const reportDataCache = new ReportDataCache();

// Auto cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    reportDataCache.cleanup();
  }, 10 * 60 * 1000);
}

// Cache key generators
export const cacheKeys = {
  fleetCertifications: (timeframe: number = 30, groupBy: string = 'status') =>
    `fleet-certifications:${timeframe}:${groupBy}`,

  pilotStats: () => 'pilot-stats',

  dashboardStats: () => 'dashboard-stats',

  complianceMetrics: (timeRange: string) => `compliance-metrics:${timeRange}`,

  analyticsData: (type: string, params?: Record<string, any>) =>
    `analytics:${type}:${JSON.stringify(params || {})}`,

  reportData: (reportType: string, params?: Record<string, any>) =>
    `report:${reportType}:${JSON.stringify(params || {})}`,
};

// Invalidation patterns
export const invalidatePatterns = {
  allFleetCertifications: () => reportDataCache.invalidatePattern('^fleet-certifications:'),
  allPilotData: () => reportDataCache.invalidatePattern('^pilot-'),
  allAnalytics: () => reportDataCache.invalidatePattern('^analytics:'),
  allReports: () => reportDataCache.invalidatePattern('^report:'),
  everything: () => reportDataCache.clear(),
};
