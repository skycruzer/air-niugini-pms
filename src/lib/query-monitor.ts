/**
 * @fileoverview Query Performance Monitoring for Air Niugini B767 PMS
 * Tracks query performance, identifies slow queries, and provides metrics
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-01
 */

/**
 * Query performance thresholds (in milliseconds)
 */
export const QUERY_THRESHOLDS = {
  FAST: 100, // < 100ms - excellent performance
  NORMAL: 500, // 100-500ms - acceptable performance
  SLOW: 1000, // 500-1000ms - needs attention
  CRITICAL: 2000, // > 2000ms - critical performance issue
} as const;

/**
 * Interface for query performance metrics
 */
export interface QueryMetrics {
  queryId: string;
  queryName: string;
  tableName?: string;
  executionTime: number;
  recordCount: number;
  timestamp: Date;
  status: 'fast' | 'normal' | 'slow' | 'critical';
  cacheHit?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for aggregated query statistics
 */
export interface QueryStats {
  totalQueries: number;
  averageExecutionTime: number;
  slowestQuery: QueryMetrics | null;
  fastestQuery: QueryMetrics | null;
  queryBreakdown: {
    fast: number;
    normal: number;
    slow: number;
    critical: number;
  };
  topSlowQueries: QueryMetrics[];
  cacheHitRate: number;
}

/**
 * Query Monitor Service for performance tracking
 */
class QueryMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 queries
  private readonly enableLogging: boolean;

  constructor() {
    // Enable detailed logging in development only
    this.enableLogging = process.env.NODE_ENV === 'development';
  }

  /**
   * Track a query execution
   * @param queryName - Descriptive name for the query
   * @param executionTimeMs - Query execution time in milliseconds
   * @param options - Additional query metadata
   * @returns Query metrics
   */
  track(
    queryName: string,
    executionTimeMs: number,
    options: {
      tableName?: string;
      recordCount?: number;
      cacheHit?: boolean;
      error?: string;
      metadata?: Record<string, any>;
    } = {}
  ): QueryMetrics {
    const status = this.determineStatus(executionTimeMs);
    const metric: QueryMetrics = {
      queryId: this.generateQueryId(),
      queryName,
      tableName: options.tableName,
      executionTime: executionTimeMs,
      recordCount: options.recordCount || 0,
      timestamp: new Date(),
      status,
      cacheHit: options.cacheHit,
      error: options.error,
      metadata: options.metadata,
    };

    // Add to metrics array
    this.metrics.push(metric);

    // Trim old metrics if exceeding limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance issues
    if (this.enableLogging) {
      this.logMetric(metric);
    }

    return metric;
  }

  /**
   * Wrap a query execution with automatic timing
   * @param queryName - Descriptive name for the query
   * @param queryFn - Async function to execute
   * @param options - Query metadata
   * @returns Query result and metrics
   */
  async measure<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    options: {
      tableName?: string;
      cacheHit?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ result: T; metrics: QueryMetrics }> {
    const startTime = Date.now();
    let result: T;
    let error: string | undefined;

    try {
      result = await queryFn();
      const executionTime = Date.now() - startTime;

      // Determine record count if result is an array
      const recordCount = Array.isArray(result) ? result.length : 1;

      const metrics = this.track(queryName, executionTime, {
        ...options,
        recordCount,
      });

      return { result, metrics };
    } catch (err) {
      const executionTime = Date.now() - startTime;
      error = err instanceof Error ? err.message : 'Unknown error';

      const metrics = this.track(queryName, executionTime, {
        ...options,
        error,
        recordCount: 0,
      });

      throw err;
    }
  }

  /**
   * Get aggregated query statistics
   * @param timeWindowMinutes - Time window for statistics (default: all time)
   * @returns Aggregated query statistics
   */
  getStats(timeWindowMinutes?: number): QueryStats {
    let metricsToAnalyze = this.metrics;

    // Filter by time window if specified
    if (timeWindowMinutes) {
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      metricsToAnalyze = this.metrics.filter((m) => m.timestamp >= cutoffTime);
    }

    if (metricsToAnalyze.length === 0) {
      return this.getEmptyStats();
    }

    // Calculate statistics
    const totalQueries = metricsToAnalyze.length;
    const totalExecutionTime = metricsToAnalyze.reduce((sum, m) => sum + m.executionTime, 0);
    const averageExecutionTime = Math.round(totalExecutionTime / totalQueries);

    // Find slowest and fastest queries
    const sortedByTime = [...metricsToAnalyze].sort((a, b) => b.executionTime - a.executionTime);
    const slowestQuery = sortedByTime[0] || null;
    const fastestQuery = sortedByTime[sortedByTime.length - 1] || null;
    const topSlowQueries = sortedByTime.slice(0, 10);

    // Calculate query breakdown
    const queryBreakdown = metricsToAnalyze.reduce(
      (acc, m) => {
        acc[m.status]++;
        return acc;
      },
      { fast: 0, normal: 0, slow: 0, critical: 0 }
    );

    // Calculate cache hit rate
    const cacheableQueries = metricsToAnalyze.filter((m) => m.cacheHit !== undefined);
    const cacheHits = cacheableQueries.filter((m) => m.cacheHit).length;
    const cacheHitRate =
      cacheableQueries.length > 0 ? Math.round((cacheHits / cacheableQueries.length) * 100) : 0;

    return {
      totalQueries,
      averageExecutionTime,
      slowestQuery,
      fastestQuery,
      queryBreakdown,
      topSlowQueries,
      cacheHitRate,
    };
  }

  /**
   * Get slow queries for review
   * @param thresholdMs - Minimum execution time to consider slow
   * @returns Array of slow queries
   */
  getSlowQueries(thresholdMs: number = QUERY_THRESHOLDS.SLOW): QueryMetrics[] {
    return this.metrics
      .filter((m) => m.executionTime >= thresholdMs)
      .sort((a, b) => b.executionTime - a.executionTime);
  }

  /**
   * Get queries by table name
   * @param tableName - Table name to filter by
   * @returns Array of queries for the specified table
   */
  getQueriesByTable(tableName: string): QueryMetrics[] {
    return this.metrics
      .filter((m) => m.tableName === tableName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get query performance by name
   * @param queryName - Query name to analyze
   * @returns Performance statistics for the query
   */
  getQueryPerformance(queryName: string): {
    count: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    errorRate: number;
  } {
    const queries = this.metrics.filter((m) => m.queryName === queryName);

    if (queries.length === 0) {
      return {
        count: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        errorRate: 0,
      };
    }

    const times = queries.map((q) => q.executionTime);
    const errors = queries.filter((q) => q.error).length;

    return {
      count: queries.length,
      averageTime: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      errorRate: Math.round((errors / queries.length) * 100),
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   * @returns Array of all metrics
   */
  exportMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  /**
   * Generate a performance report
   * @returns Formatted performance report
   */
  generateReport(timeWindowMinutes?: number): string {
    const stats = this.getStats(timeWindowMinutes);
    const slowQueries = this.getSlowQueries();

    let report = '=== Query Performance Report ===\n\n';
    report += `Total Queries: ${stats.totalQueries}\n`;
    report += `Average Execution Time: ${stats.averageExecutionTime}ms\n`;
    report += `Cache Hit Rate: ${stats.cacheHitRate}%\n\n`;

    report += 'Query Breakdown:\n';
    report += `  Fast (< ${QUERY_THRESHOLDS.FAST}ms): ${stats.queryBreakdown.fast}\n`;
    report += `  Normal (${QUERY_THRESHOLDS.FAST}-${QUERY_THRESHOLDS.NORMAL}ms): ${stats.queryBreakdown.normal}\n`;
    report += `  Slow (${QUERY_THRESHOLDS.SLOW}-${QUERY_THRESHOLDS.CRITICAL}ms): ${stats.queryBreakdown.slow}\n`;
    report += `  Critical (> ${QUERY_THRESHOLDS.CRITICAL}ms): ${stats.queryBreakdown.critical}\n\n`;

    if (stats.slowestQuery) {
      report += `Slowest Query: ${stats.slowestQuery.queryName} (${stats.slowestQuery.executionTime}ms)\n`;
    }

    if (slowQueries.length > 0) {
      report += '\nTop 5 Slow Queries:\n';
      slowQueries.slice(0, 5).forEach((q, i) => {
        report += `  ${i + 1}. ${q.queryName}: ${q.executionTime}ms (${q.recordCount} records)\n`;
      });
    }

    return report;
  }

  /**
   * Determine query performance status
   */
  private determineStatus(executionTimeMs: number): QueryMetrics['status'] {
    if (executionTimeMs < QUERY_THRESHOLDS.FAST) return 'fast';
    if (executionTimeMs < QUERY_THRESHOLDS.SLOW) return 'normal';
    if (executionTimeMs < QUERY_THRESHOLDS.CRITICAL) return 'slow';
    return 'critical';
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log query metric to console
   */
  private logMetric(metric: QueryMetrics): void {
    const icon = {
      fast: '⚡',
      normal: '✅',
      slow: '⚠️',
      critical: '🔴',
    }[metric.status];

    const cacheInfo =
      metric.cacheHit !== undefined ? (metric.cacheHit ? ' [CACHE HIT]' : ' [CACHE MISS]') : '';

    if (metric.status === 'slow' || metric.status === 'critical') {
      console.warn(
        `${icon} Query "${metric.queryName}" took ${metric.executionTime}ms (${metric.recordCount} records)${cacheInfo}`
      );
    } else if (this.enableLogging) {
      console.log(
        `${icon} Query "${metric.queryName}": ${metric.executionTime}ms (${metric.recordCount} records)${cacheInfo}`
      );
    }
  }

  /**
   * Get empty statistics object
   */
  private getEmptyStats(): QueryStats {
    return {
      totalQueries: 0,
      averageExecutionTime: 0,
      slowestQuery: null,
      fastestQuery: null,
      queryBreakdown: { fast: 0, normal: 0, slow: 0, critical: 0 },
      topSlowQueries: [],
      cacheHitRate: 0,
    };
  }
}

// Export singleton instance
export const queryMonitor = new QueryMonitor();

/**
 * Convenience function to measure query performance
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  options?: {
    tableName?: string;
    cacheHit?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<T> {
  const { result } = await queryMonitor.measure(queryName, queryFn, options);
  return result;
}

/**
 * Convenience function to track manual query timing
 */
export function trackQuery(
  queryName: string,
  executionTimeMs: number,
  options?: {
    tableName?: string;
    recordCount?: number;
    cacheHit?: boolean;
    error?: string;
  }
): void {
  queryMonitor.track(queryName, executionTimeMs, options);
}
