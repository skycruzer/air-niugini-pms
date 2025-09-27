/**
 * @fileoverview Retry Utility Functions for Air Niugini B767 Pilot Management System
 * Provides robust retry mechanisms for API calls and network operations
 * to improve reliability and handle transient failures gracefully.
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-28
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number
  /** Base delay between retries in milliseconds */
  baseDelay?: number
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number
  /** Exponential backoff multiplier */
  backoffMultiplier?: number
  /** Request timeout in milliseconds */
  timeout?: number
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: any, attempt: number) => boolean
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  timeout: 10000,
  shouldRetry: (error: any, attempt: number) => {
    // Retry on network errors, 5xx errors, but not on 4xx client errors
    if (error?.status >= 400 && error?.status < 500) return false
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) return true
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') return true
    return attempt < 3
  }
}

/**
 * Utility function to add timeout to fetch requests
 */
export function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

/**
 * Retry wrapper for API calls with exponential backoff
 * @template T - Return type of the async function
 * @param {() => Promise<T>} fn - Async function to retry
 * @param {Partial<RetryOptions>} options - Retry configuration options
 * @returns {Promise<T>} Result of successful function execution
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: any

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry this error
      if (!config.shouldRetry(error, attempt) || attempt === config.maxAttempts) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )

      console.warn(`⚠️ Attempt ${attempt}/${config.maxAttempts} failed, retrying in ${delay}ms:`, error instanceof Error ? error.message : String(error))

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Robust fetch with retry logic and timeout
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {Partial<RetryOptions>} retryOptions - Retry configuration
 * @returns {Promise<Response>} Fetch response
 */
export async function robustFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions }

  return withRetry(async () => {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Cache-Control': 'no-cache',
        ...options.headers
      }
    }, config.timeout)

    // Check for HTTP errors
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      ;(error as any).status = response.status
      ;(error as any).response = response
      throw error
    }

    return response
  }, retryOptions)
}

/**
 * Retry API call with JSON parsing
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @param {Partial<RetryOptions>} retryOptions - Retry configuration
 * @returns {Promise<any>} Parsed JSON response
 */
export async function robustAPICall(
  url: string,
  options: RequestInit = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<any> {
  const response = await robustFetch(url, options, retryOptions)

  try {
    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`)
  }
}

/**
 * Circuit breaker pattern for API calls
 * Temporarily stops making requests if failure rate is too high
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private readonly failureThreshold = 5,
    private readonly timeoutMs = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeoutMs) {
        throw new Error('Circuit breaker is OPEN - requests blocked')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
      console.warn(`🔴 Circuit breaker OPEN after ${this.failures} failures`)
    }
  }

  getState(): string {
    return this.state
  }

  getFailures(): number {
    return this.failures
  }
}

// Export singleton circuit breaker for API calls
export const apiCircuitBreaker = new CircuitBreaker()