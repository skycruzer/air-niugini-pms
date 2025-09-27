/**
 * @fileoverview Cache Service for Air Niugini B767 Pilot Management System
 * Provides in-memory caching for frequently accessed static data to improve performance.
 * Implements TTL-based cache invalidation and refresh strategies for optimal balance
 * between performance and data freshness.
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Interface for cached data entry with timestamp tracking
 * @interface CacheEntry
 * @template T - Type of the cached data
 * @property {T} data - The cached data
 * @property {number} timestamp - When the data was cached (Unix timestamp)
 * @property {number} ttl - Time-to-live in milliseconds
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Cache configuration constants
 * TTL values optimized for data change frequency patterns
 */
const CACHE_CONFIG = {
  /** Check types rarely change - cache for 1 hour */
  CHECK_TYPES_TTL: 60 * 60 * 1000,
  /** Contract types very stable - cache for 2 hours */
  CONTRACT_TYPES_TTL: 2 * 60 * 60 * 1000,
  /** Settings change infrequently - cache for 30 minutes */
  SETTINGS_TTL: 30 * 60 * 1000,
  /** Pilot stats need regular updates - cache for 5 minutes */
  PILOT_STATS_TTL: 5 * 60 * 1000,
  /** Maximum cache entries to prevent memory leaks */
  MAX_CACHE_SIZE: 100,
  /** Cache cleanup interval - every 5 minutes */
  CLEANUP_INTERVAL: 5 * 60 * 1000
} as const

/**
 * In-memory cache storage with automatic cleanup
 * Uses Map for O(1) lookup performance and prevents memory leaks
 */
class CacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
    // Start automatic cleanup to prevent memory leaks
    this.startCleanup()
  }

  /**
   * Start automatic cleanup process
   */
  private startCleanup(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, CACHE_CONFIG.CLEANUP_INTERVAL)
  }

  /**
   * Stop automatic cleanup (for testing)
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * Perform cache cleanup to prevent memory leaks
   */
  private performCleanup(): void {
    const now = Date.now()
    let expiredCount = 0

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        expiredCount++
      }
    }

    // If still too many entries, remove oldest ones
    if (this.cache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)

      const toRemove = entries.slice(0, this.cache.size - CACHE_CONFIG.MAX_CACHE_SIZE)
      toRemove.forEach(([key]) => this.cache.delete(key))

      console.log(`🧹 Cache cleanup: removed ${expiredCount} expired + ${toRemove.length} oldest entries`)
    } else if (expiredCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${expiredCount} expired entries`)
    }
  }

  /**
   * Generic cache retrieval method with automatic expiry checking
   * @template T - Type of the cached data
   * @param {string} key - Cache key identifier
   * @returns {T | null} Cached data if valid and not expired, null otherwise
   */
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Generic cache storage method with TTL configuration
   * @template T - Type of the data to cache
   * @param {string} key - Cache key identifier
   * @param {T} data - Data to cache
   * @param {number} ttl - Time-to-live in milliseconds
   */
  private set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Retrieves check types from cache or database
   * Check types are aviation certification categories that rarely change
   * @returns {Promise<any[]>} Array of check type records
   */
  async getCheckTypes(): Promise<any[]> {
    const cacheKey = 'check_types'
    let checkTypes = this.get<any[]>(cacheKey)

    if (!checkTypes) {
      console.log('🔄 Cache miss: Fetching check types from database')
      const supabaseAdmin = getSupabaseAdmin()

      const { data, error } = await supabaseAdmin
        .from('check_types')
        .select('*')
        .order('check_code')

      if (error) {
        console.error('❌ Cache Service: Error fetching check types:', error)
        throw error
      }

      checkTypes = data || []
      this.set(cacheKey, checkTypes, CACHE_CONFIG.CHECK_TYPES_TTL)
      console.log(`✅ Cached ${checkTypes?.length || 0} check types for ${CACHE_CONFIG.CHECK_TYPES_TTL / 1000 / 60} minutes`)
    }

    return checkTypes || []
  }

  /**
   * Retrieves contract types from cache or database
   * Contract types (Fulltime, Commuting, Tours) are very stable
   * @returns {Promise<any[]>} Array of contract type records
   */
  async getContractTypes(): Promise<any[]> {
    const cacheKey = 'contract_types'
    let contractTypes = this.get<any[]>(cacheKey)

    if (!contractTypes) {
      console.log('🔄 Cache miss: Fetching contract types from database')
      const supabaseAdmin = getSupabaseAdmin()

      const { data, error } = await supabaseAdmin
        .from('contract_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ Cache Service: Error fetching contract types:', error)
        throw error
      }

      contractTypes = data || []
      this.set(cacheKey, contractTypes, CACHE_CONFIG.CONTRACT_TYPES_TTL)
      console.log(`✅ Cached ${contractTypes?.length || 0} contract types for ${CACHE_CONFIG.CONTRACT_TYPES_TTL / 1000 / 60} minutes`)
    }

    return contractTypes || []
  }

  /**
   * Retrieves system settings from cache or database
   * Settings include configurable parameters like retirement age
   * @returns {Promise<any[]>} Array of settings records
   */
  async getSettings(): Promise<any[]> {
    const cacheKey = 'settings'
    let settings = this.get<any[]>(cacheKey)

    if (!settings) {
      console.log('🔄 Cache miss: Fetching settings from database')
      const supabaseAdmin = getSupabaseAdmin()

      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('*')

      if (error) {
        console.error('❌ Cache Service: Error fetching settings:', error)
        throw error
      }

      settings = data || []
      this.set(cacheKey, settings, CACHE_CONFIG.SETTINGS_TTL)
      console.log(`✅ Cached ${settings?.length || 0} settings for ${CACHE_CONFIG.SETTINGS_TTL / 1000 / 60} minutes`)
    }

    return settings || []
  }

  /**
   * Retrieves pilot statistics from cache or database
   * Statistics include total counts and certification metrics
   * @returns {Promise<any>} Pilot statistics object
   */
  async getPilotStats(): Promise<any> {
    const cacheKey = 'pilot_stats'
    let stats = this.get<any>(cacheKey)

    if (!stats) {
      console.log('🔄 Cache miss: Calculating pilot statistics from database')
      const supabaseAdmin = getSupabaseAdmin()

      try {
        // Execute multiple queries in parallel for better performance
        const [pilotsResult, checksResult, checkTypesResult] = await Promise.all([
          supabaseAdmin
            .from('pilots')
            .select('id, is_active, role, captain_qualifications, date_of_birth')
            .eq('is_active', true),

          supabaseAdmin
            .from('pilot_checks')
            .select('expiry_date'),

          supabaseAdmin
            .from('check_types')
            .select('id')
        ])

        if (pilotsResult.error) throw pilotsResult.error
        if (checksResult.error) throw checksResult.error
        if (checkTypesResult.error) throw checkTypesResult.error

        const pilots = pilotsResult.data || []
        const checks = checksResult.data || []
        const checkTypes = checkTypesResult.data || []

        // Calculate certification status statistics
        const today = new Date()
        const certificationStats = checks.reduce((acc: any, check: any) => {
          if (!check.expiry_date) return acc

          const expiryDate = new Date(check.expiry_date)
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiry < 0) {
            acc.expired++
          } else if (daysUntilExpiry <= 30) {
            acc.expiring++
          } else {
            acc.current++
          }

          return acc
        }, { current: 0, expiring: 0, expired: 0 })

        // Calculate captain qualifications
        let trainingCaptains = 0
        let examiners = 0
        let nearingRetirement = 0

        const retirementAge = 65 // Standard retirement age for pilots

        pilots.forEach((pilot: any) => {
          // Count training captains and examiners from captain_qualifications JSONB array
          if (pilot.captain_qualifications && Array.isArray(pilot.captain_qualifications)) {
            if (pilot.captain_qualifications.includes('training_captain')) {
              trainingCaptains++
            }
            if (pilot.captain_qualifications.includes('examiner')) {
              examiners++
            }
          }

          // Calculate pilots nearing retirement (within 2 years)
          if (pilot.date_of_birth) {
            const birthDate = new Date(pilot.date_of_birth)
            const age = today.getFullYear() - birthDate.getFullYear()
            const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
            const actualAge = birthdayThisYear <= today ? age : age - 1

            if (actualAge >= retirementAge - 2) { // Within 2 years of retirement
              nearingRetirement++
            }
          }
        })

        stats = {
          totalPilots: pilots.length,
          captains: pilots.filter((p: any) => p.role === 'Captain').length,
          firstOfficers: pilots.filter((p: any) => p.role === 'First Officer').length,
          trainingCaptains,
          examiners,
          nearingRetirement,
          totalCertifications: checks.length,
          totalCheckTypes: checkTypes.length,
          certificationStatus: certificationStats,
          lastUpdated: new Date().toISOString()
        }

        this.set(cacheKey, stats, CACHE_CONFIG.PILOT_STATS_TTL)
        console.log(`✅ Cached pilot statistics for ${CACHE_CONFIG.PILOT_STATS_TTL / 1000 / 60} minutes`)
      } catch (error) {
        console.error('❌ Cache Service: Error calculating pilot statistics:', error)
        throw error
      }
    }

    return stats
  }

  /**
   * Manually invalidate specific cache entry
   * Useful when data is updated and immediate refresh is needed
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
      console.log(`🗑️ Cache invalidated: ${key}`)
    }
  }

  /**
   * Invalidate all cached data
   * Use sparingly, typically only during major data updates
   */
  invalidateAll(): void {
    const cacheSize = this.cache.size
    this.cache.clear()
    console.log(`🗑️ Cache cleared: ${cacheSize} entries removed`)
  }

  /**
   * Get cache statistics for monitoring and debugging
   * @returns {object} Cache statistics including size and hit rates
   */
  getStats(): object {
    const entries = Array.from(this.cache.entries())
    const now = Date.now()

    const stats = {
      totalEntries: this.cache.size,
      entries: entries.map(([key, entry]) => ({
        key,
        ageMinutes: Math.round((now - entry.timestamp) / 1000 / 60),
        ttlMinutes: Math.round(entry.ttl / 1000 / 60),
        expired: (now - entry.timestamp) > entry.ttl
      }))
    }

    return stats
  }

  /**
   * Warm up cache by pre-loading frequently accessed data
   * Call this during application startup for optimal performance
   */
  async warmUp(): Promise<void> {
    console.log('🔥 Warming up cache with frequently accessed data...')

    try {
      await Promise.all([
        this.getCheckTypes(),
        this.getContractTypes(),
        this.getSettings()
      ])
      console.log('✅ Cache warm-up completed successfully')
    } catch (error) {
      console.error('❌ Cache warm-up failed:', error)
      // Don't throw error - application should still work without cache
    }
  }
}

// Export singleton instance for consistent cache across application
export const cacheService = new CacheService()

/**
 * Utility function to invalidate cache when data is updated
 * Use this in API routes and mutations to ensure data freshness
 * @param {string[]} keys - Array of cache keys to invalidate
 */
export function invalidateCache(keys: string[]): void {
  keys.forEach(key => cacheService.invalidate(key))
}

/**
 * Pre-defined cache invalidation patterns for common operations
 */
export const CACHE_INVALIDATION_PATTERNS = {
  /** Invalidate when check types are modified */
  CHECK_TYPES_UPDATED: ['check_types'],
  /** Invalidate when contract types are modified */
  CONTRACT_TYPES_UPDATED: ['contract_types'],
  /** Invalidate when settings are modified */
  SETTINGS_UPDATED: ['settings'],
  /** Invalidate when pilots or certifications are modified */
  PILOT_DATA_UPDATED: ['pilot_stats'],
  /** Invalidate everything for major updates */
  FULL_REFRESH: ['check_types', 'contract_types', 'settings', 'pilot_stats']
} as const