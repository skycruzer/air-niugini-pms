/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Implements token-based CSRF protection for mutation requests.
 * Tokens are stored in httpOnly cookies and validated on each request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_MAX_AGE = 3600; // 1 hour in seconds

// In-memory store for CSRF tokens (in production, consider using Redis)
// Structure: Map<token, { createdAt: number, userId?: string }>
const csrfTokenStore = new Map<string, { createdAt: number; userId?: string }>();

// Cleanup expired tokens every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start cleanup timer to remove expired CSRF tokens
 */
function startCleanupTimer() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const maxAge = CSRF_TOKEN_MAX_AGE * 1000;
    let tokensRemoved = 0;

    for (const [token, data] of csrfTokenStore.entries()) {
      if (now - data.createdAt > maxAge) {
        csrfTokenStore.delete(token);
        tokensRemoved++;
      }
    }

    if (tokensRemoved > 0) {
      logger.debug(`CSRF cleanup: Removed ${tokensRemoved} expired tokens`);
    }
  }, CLEANUP_INTERVAL);
}

// Start cleanup timer on module load
startCleanupTimer();

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(userId?: string): string {
  const token = nanoid(CSRF_TOKEN_LENGTH);

  csrfTokenStore.set(token, {
    createdAt: Date.now(),
    userId,
  });

  logger.debug('Generated new CSRF token', {
    token: token.substring(0, 8) + '...',
    userId: userId || 'anonymous',
  });

  return token;
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(token: string, userId?: string): boolean {
  if (!token) {
    logger.warn('CSRF validation failed: No token provided');
    return false;
  }

  const tokenData = csrfTokenStore.get(token);

  if (!tokenData) {
    logger.warn('CSRF validation failed: Token not found in store');
    return false;
  }

  // Check if token is expired
  const now = Date.now();
  const maxAge = CSRF_TOKEN_MAX_AGE * 1000;
  if (now - tokenData.createdAt > maxAge) {
    logger.warn('CSRF validation failed: Token expired');
    csrfTokenStore.delete(token);
    return false;
  }

  // Validate user ID if provided
  if (userId && tokenData.userId && tokenData.userId !== userId) {
    logger.warn('CSRF validation failed: User ID mismatch');
    return false;
  }

  logger.debug('CSRF token validated successfully');
  return true;
}

/**
 * Get CSRF token from request cookies
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_TOKEN_COOKIE_NAME}=`));

  if (!csrfCookie) {
    return null;
  }

  return csrfCookie.split('=')[1];
}

/**
 * Get CSRF token from request header
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_TOKEN_HEADER_NAME);
}

/**
 * Add CSRF token to response as httpOnly cookie
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): NextResponse {
  const cookieValue = `${CSRF_TOKEN_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${CSRF_TOKEN_MAX_AGE}; Path=/`;

  response.headers.append('Set-Cookie', cookieValue);

  // Also send token in header for client-side access (for API requests)
  response.headers.set(CSRF_TOKEN_HEADER_NAME, token);

  return response;
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  // Only protect mutation methods (POST, PUT, DELETE, PATCH)
  const mutationMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  return mutationMethods.includes(method.toUpperCase());
}

/**
 * Middleware to validate CSRF token for protected requests
 */
export async function validateCsrfMiddleware(
  request: NextRequest,
  userId?: string
): Promise<NextResponse | null> {
  // Only validate for mutation methods
  if (!requiresCsrfProtection(request.method)) {
    return null;
  }

  // Get token from header (required for API requests)
  const headerToken = getCsrfTokenFromHeader(request);

  // Get token from cookie for validation
  const cookieToken = getCsrfTokenFromCookie(request);

  // Both tokens must be present and match
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    logger.warn('CSRF validation failed: Token mismatch or missing', {
      method: request.method,
      url: request.url,
      hasHeaderToken: !!headerToken,
      hasCookieToken: !!cookieToken,
      tokensMatch: headerToken === cookieToken,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'CSRF token validation failed',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      },
      { status: 403 }
    );
  }

  // Validate token
  const isValid = validateCsrfToken(headerToken, userId);

  if (!isValid) {
    logger.warn('CSRF validation failed: Invalid token', {
      method: request.method,
      url: request.url,
      userId,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'CSRF token validation failed',
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      },
      { status: 403 }
    );
  }

  // Token is valid, allow request to continue
  return null;
}

/**
 * Wrapper to add CSRF protection to a route handler
 */
export function withCsrfProtection(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Generate CSRF token for GET requests (to be used in subsequent mutations)
    if (request.method === 'GET') {
      const response = await handler(request, ...args);
      const token = generateCsrfToken();
      return setCsrfTokenCookie(response, token);
    }

    // Validate CSRF token for mutation requests
    const csrfError = await validateCsrfMiddleware(request);
    if (csrfError) {
      return csrfError;
    }

    // Execute handler
    return handler(request, ...args);
  };
}

/**
 * Invalidate CSRF token (e.g., on logout)
 */
export function invalidateCsrfToken(token: string): void {
  csrfTokenStore.delete(token);
  logger.debug('CSRF token invalidated');
}

/**
 * Clear all CSRF tokens for a user
 */
export function clearUserCsrfTokens(userId: string): void {
  let tokensCleared = 0;

  for (const [token, data] of csrfTokenStore.entries()) {
    if (data.userId === userId) {
      csrfTokenStore.delete(token);
      tokensCleared++;
    }
  }

  if (tokensCleared > 0) {
    logger.debug(`Cleared ${tokensCleared} CSRF tokens for user ${userId}`);
  }
}

/**
 * Get CSRF token statistics (for monitoring)
 */
export function getCsrfTokenStats(): {
  totalTokens: number;
  validTokens: number;
  expiredTokens: number;
} {
  const now = Date.now();
  const maxAge = CSRF_TOKEN_MAX_AGE * 1000;
  let validTokens = 0;
  let expiredTokens = 0;

  for (const data of csrfTokenStore.values()) {
    if (now - data.createdAt > maxAge) {
      expiredTokens++;
    } else {
      validTokens++;
    }
  }

  return {
    totalTokens: csrfTokenStore.size,
    validTokens,
    expiredTokens,
  };
}
