/**
 * @fileoverview Connection Pooling and Retry Logic for Air Niugini B767 PMS
 * Provides robust connection management with automatic retry and backoff
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-01
 */

import { getSupabaseAdmin } from './supabase';

/**
 * Connection pool configuration
 */
export const CONNECTION_POOL_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
  /** Initial retry delay in milliseconds */
  INITIAL_RETRY_DELAY: 1000,
  /** Maximum retry delay in milliseconds */
  MAX_RETRY_DELAY: 10000,
  /** Backoff multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Query timeout in milliseconds */
  QUERY_TIMEOUT: 30000,
  /** Connection timeout in milliseconds */
  CONNECTION_TIMEOUT: 10000,
} as const;

/**
 * Interface for retry options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  timeout?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * Default retry condition - retries on network errors and timeouts
 * @param error - Error object
 * @param attempt - Current retry attempt
 * @returns True if should retry
 */
export function defaultShouldRetry(error: any, attempt: number): boolean {
  // Don't retry after max attempts
  if (attempt >= CONNECTION_POOL_CONFIG.MAX_RETRIES) {
    return false;
  }

  // Retry on network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // Retry on temporary Supabase errors
  if (error.code === 'PGRST301' || error.code === '08006') {
    return true;
  }

  // Retry on 5xx server errors
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // Retry on rate limiting (429)
  if (error.status === 429) {
    return true;
  }

  // Don't retry on client errors (4xx except 429)
  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
    return false;
  }

  // Default: retry for unknown errors
  return true;
}

/**
 * Calculate exponential backoff delay
 * @param attempt - Current retry attempt (0-indexed)
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, options: RetryOptions = {}): number {
  const {
    initialDelay = CONNECTION_POOL_CONFIG.INITIAL_RETRY_DELAY,
    maxDelay = CONNECTION_POOL_CONFIG.MAX_RETRY_DELAY,
    backoffMultiplier = CONNECTION_POOL_CONFIG.BACKOFF_MULTIPLIER,
  } = options;

  const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);

  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return Math.floor(delay + jitter);
}

/**
 * Sleep for specified duration
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @template T
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = CONNECTION_POOL_CONFIG.MAX_RETRIES,
    shouldRetry = defaultShouldRetry,
    timeout = CONNECTION_POOL_CONFIG.QUERY_TIMEOUT,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to the function
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        ),
      ]);

      // Success - log retry info if this wasn't the first attempt
      if (attempt > 0) {
        console.log(`✅ Query succeeded after ${attempt} retries`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!shouldRetry(error, attempt)) {
        console.error(`❌ Query failed - not retrying:`, error);
        throw error;
      }

      // Check if we've exhausted retries
      if (attempt >= maxRetries) {
        console.error(`❌ Query failed after ${maxRetries} retries:`, error);
        throw error;
      }

      // Calculate backoff delay and wait
      const delay = calculateBackoffDelay(attempt, options);
      console.warn(
        `⚠️ Query failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
        error instanceof Error ? error.message : String(error)
      );

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Execute Supabase query with retry logic
 * @template T
 * @param queryFn - Function that returns a Supabase query
 * @param options - Retry options
 * @returns Query result
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(async () => {
    const { data, error } = await queryFn();

    if (error) {
      throw error;
    }

    if (data === null) {
      throw new Error('Query returned null data');
    }

    return data;
  }, options);
}

/**
 * Execute multiple queries in parallel with retry logic
 * @param queries - Array of query functions
 * @param options - Retry options
 * @returns Array of results
 */
export async function executeParallelWithRetry<T>(
  queries: Array<() => Promise<{ data: T | null; error: any }>>,
  options: RetryOptions = {}
): Promise<T[]> {
  const promises = queries.map((queryFn) => executeWithRetry(queryFn, options));

  return Promise.all(promises);
}

/**
 * Connection health check
 * Tests database connection and measures latency
 * @returns Health check result with latency
 */
export async function checkConnectionHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Simple query to test connection
    const { data, error } = await Promise.race([
      supabaseAdmin.from('pilots').select('id').limit(1),
      new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(
          () => reject(new Error('Connection timeout')),
          CONNECTION_POOL_CONFIG.CONNECTION_TIMEOUT
        )
      ),
    ]);

    const latency = Date.now() - startTime;

    if (error) {
      return {
        healthy: false,
        latency,
        error: error.message || 'Unknown error',
      };
    }

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    return {
      healthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch query execution with automatic chunking
 * Splits large queries into smaller chunks to avoid timeout
 * @template T
 * @param items - Array of items to process
 * @param queryFn - Function to execute for each chunk
 * @param chunkSize - Size of each chunk (default: 100)
 * @param options - Retry options
 * @returns Combined results from all chunks
 */
export async function executeBatchQueries<T, R>(
  items: T[],
  queryFn: (chunk: T[]) => Promise<{ data: R[] | null; error: any }>,
  chunkSize: number = 100,
  options: RetryOptions = {}
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  console.log(`📊 Executing batch query: ${items.length} items in ${chunks.length} chunks`);

  const results: R[][] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} items)`);

    const chunkResult = await executeWithRetry(() => queryFn(chunk), options);

    results.push(chunkResult);
  }

  // Flatten results
  return results.flat();
}

/**
 * Query queue for rate limiting and connection pooling
 */
class QueryQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 10) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add query to queue and execute when slot available
   * @template T
   * @param queryFn - Query function to execute
   * @returns Promise that resolves when query completes
   */
  async enqueue<T>(queryFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.running++;

        try {
          const result = await queryFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      this.queue.push(execute);
      this.processQueue();
    });
  }

  /**
   * Process queued queries
   */
  private processQueue(): void {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const execute = this.queue.shift();
      if (execute) {
        execute();
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): { queueLength: number; running: number; maxConcurrent: number } {
    return {
      queueLength: this.queue.length,
      running: this.running,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// Export singleton query queue
export const queryQueue = new QueryQueue(10);

/**
 * Execute query through queue with automatic retry
 * @template T
 * @param queryFn - Query function
 * @param options - Retry options
 * @returns Query result
 */
export async function executeQueuedQuery<T>(
  queryFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return queryQueue.enqueue(() => retryWithBackoff(queryFn, options));
}

/**
 * Monitor connection pool health
 * Runs periodic health checks and logs warnings
 */
export class ConnectionMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number;
  private healthHistory: Array<{ timestamp: Date; healthy: boolean; latency: number }> = [];

  constructor(checkIntervalMs: number = 60000) {
    this.checkInterval = checkIntervalMs;
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.intervalId) {
      console.warn('⚠️ Connection monitor already running');
      return;
    }

    console.log(`🔍 Starting connection health monitoring (every ${this.checkInterval / 1000}s)`);

    this.intervalId = setInterval(async () => {
      const health = await checkConnectionHealth();

      this.healthHistory.push({
        timestamp: new Date(),
        healthy: health.healthy,
        latency: health.latency,
      });

      // Keep only last 100 checks
      if (this.healthHistory.length > 100) {
        this.healthHistory.shift();
      }

      if (!health.healthy) {
        console.error(`❌ Database connection unhealthy: ${health.error}`);
      } else if (health.latency > 1000) {
        console.warn(`⚠️ High database latency: ${health.latency}ms`);
      }
    }, this.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Connection health monitoring stopped');
    }
  }

  /**
   * Get health history
   */
  getHealthHistory(): Array<{ timestamp: Date; healthy: boolean; latency: number }> {
    return [...this.healthHistory];
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    if (this.healthHistory.length === 0) return 0;

    const sum = this.healthHistory.reduce((acc, h) => acc + h.latency, 0);
    return Math.round(sum / this.healthHistory.length);
  }

  /**
   * Get uptime percentage
   */
  getUptimePercentage(): number {
    if (this.healthHistory.length === 0) return 100;

    const healthy = this.healthHistory.filter((h) => h.healthy).length;
    return Math.round((healthy / this.healthHistory.length) * 100);
  }
}

// Export singleton connection monitor (not started by default)
export const connectionMonitor = new ConnectionMonitor();
