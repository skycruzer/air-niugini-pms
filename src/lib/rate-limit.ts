/**
 * Rate Limiting System
 *
 * Implements in-memory rate limiting with configurable limits for different endpoint types.
 * Tracks requests by IP address and user ID to prevent abuse.
 *
 * Rate Limits:
 * - Auth endpoints: 5 requests/minute (prevent brute force attacks)
 * - Read endpoints: 100 requests/minute (normal data retrieval)
 * - Write endpoints: 30 requests/minute (data mutations)
 * - Bulk operations: 10 requests/minute (expensive operations)
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit configuration types
export enum RateLimitTier {
  AUTH = 'auth',
  READ = 'read',
  WRITE = 'write',
  BULK = 'bulk',
  REPORT = 'report',
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  tier: RateLimitTier;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limit configurations
const RATE_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  [RateLimitTier.AUTH]: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    tier: RateLimitTier.AUTH,
  },
  [RateLimitTier.READ]: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    tier: RateLimitTier.READ,
  },
  [RateLimitTier.WRITE]: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    tier: RateLimitTier.WRITE,
  },
  [RateLimitTier.BULK]: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    tier: RateLimitTier.BULK,
  },
  [RateLimitTier.REPORT]: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    tier: RateLimitTier.REPORT,
  },
};

// In-memory store for rate limit tracking
// Structure: Map<identifier, Map<tier, RateLimitEntry>>
const rateLimitStore = new Map<string, Map<RateLimitTier, RateLimitEntry>>();

// Cleanup interval to remove expired entries (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start the cleanup timer to remove expired rate limit entries
 */
function startCleanupTimer() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let entriesRemoved = 0;

    for (const [identifier, tierMap] of rateLimitStore.entries()) {
      for (const [tier, entry] of tierMap.entries()) {
        if (now > entry.resetTime) {
          tierMap.delete(tier);
          entriesRemoved++;
        }
      }

      // Remove identifier if no tiers remain
      if (tierMap.size === 0) {
        rateLimitStore.delete(identifier);
      }
    }

    if (entriesRemoved > 0) {
      console.log(`🧹 Rate limit cleanup: Removed ${entriesRemoved} expired entries`);
    }
  }, CLEANUP_INTERVAL);
}

// Start cleanup timer on module load
startCleanupTimer();

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';

  return `ip:${ip}`;
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or response with 429 status if rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  tier: RateLimitTier,
  userId?: string
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(request, userId);
  const config = RATE_LIMITS[tier];
  const now = Date.now();

  // Get or create tier map for this identifier
  let tierMap = rateLimitStore.get(identifier);
  if (!tierMap) {
    tierMap = new Map();
    rateLimitStore.set(identifier, tierMap);
  }

  // Get or create entry for this tier
  let entry = tierMap.get(tier);

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    tierMap.set(tier, entry);
  }

  // Increment request count
  entry.count++;

  // Check if rate limit exceeded
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    console.warn('🚫 Rate limit exceeded:', {
      identifier,
      tier,
      count: entry.count,
      limit: config.maxRequests,
      retryAfter,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    );
  }

  // Request allowed - return null to continue
  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  tier: RateLimitTier,
  identifier: string
): NextResponse {
  const config = RATE_LIMITS[tier];
  const tierMap = rateLimitStore.get(identifier);
  const entry = tierMap?.get(tier);

  if (entry) {
    const remaining = Math.max(0, config.maxRequests - entry.count);
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
  }

  return response;
}

/**
 * Middleware wrapper that applies rate limiting to a route handler
 */
export function withRateLimit(
  tier: RateLimitTier,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Extract user ID from auth header if present (for authenticated endpoints)
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    // Note: User ID extraction would require decoding JWT token
    // For now, we'll rely on IP-based rate limiting

    // Check rate limit
    const rateLimitResponse = await checkRateLimit(request, tier, userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Execute handler
    const response = await handler(request, ...args);

    // Add rate limit headers to response
    const identifier = getClientIdentifier(request, userId);
    return addRateLimitHeaders(response, tier, identifier);
  };
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(
  identifier: string,
  tier: RateLimitTier
): {
  count: number;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const config = RATE_LIMITS[tier];
  const tierMap = rateLimitStore.get(identifier);
  const entry = tierMap?.get(tier);

  if (!entry || Date.now() > entry.resetTime) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }

  return {
    count: entry.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Clear rate limit for an identifier (useful for testing or manual override)
 */
export function clearRateLimit(identifier: string, tier?: RateLimitTier) {
  if (tier) {
    const tierMap = rateLimitStore.get(identifier);
    if (tierMap) {
      tierMap.delete(tier);
      if (tierMap.size === 0) {
        rateLimitStore.delete(identifier);
      }
    }
  } else {
    rateLimitStore.delete(identifier);
  }
}

/**
 * Get rate limit statistics (for monitoring/debugging)
 */
export function getRateLimitStats(): {
  totalIdentifiers: number;
  totalEntries: number;
  byTier: Record<RateLimitTier, number>;
} {
  let totalEntries = 0;
  const byTier: Record<RateLimitTier, number> = {
    [RateLimitTier.AUTH]: 0,
    [RateLimitTier.READ]: 0,
    [RateLimitTier.WRITE]: 0,
    [RateLimitTier.BULK]: 0,
    [RateLimitTier.REPORT]: 0,
  };

  for (const tierMap of rateLimitStore.values()) {
    for (const [tier] of tierMap.entries()) {
      totalEntries++;
      byTier[tier]++;
    }
  }

  return {
    totalIdentifiers: rateLimitStore.size,
    totalEntries,
    byTier,
  };
}
