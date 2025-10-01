/**
 * Security Middleware
 *
 * Comprehensive security middleware that applies:
 * - Rate limiting
 * - CSRF protection
 * - Input sanitization
 * - Request validation
 * - Security headers
 * - Content type validation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  addRateLimitHeaders,
  getClientIdentifier,
  RateLimitTier,
} from './rate-limit';
import { validateCsrfMiddleware, generateCsrfToken, setCsrfTokenCookie } from './csrf';
import { validateContentType, sanitizeObject } from './input-sanitization';
import { logSecurityEvent, SecurityEventType } from './security-audit';

export interface SecurityConfig {
  rateLimitTier: RateLimitTier;
  requireCsrf: boolean;
  validateContentType?: string[];
  sanitizeInput?: boolean;
  requireAuth?: boolean;
}

/**
 * Security headers to apply to all responses
 */
const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (disable unnecessary features)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  // Content Security Policy (strict)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-inline needed for Next.js
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  return response;
}

/**
 * Validate request method
 */
function validateRequestMethod(
  request: NextRequest,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Method not allowed',
        message: `HTTP method ${request.method} is not allowed for this endpoint`,
      },
      {
        status: 405,
        headers: {
          Allow: allowedMethods.join(', '),
        },
      }
    );
  }

  return null;
}

/**
 * Validate request content type for mutation requests
 */
function validateRequestContentType(
  request: NextRequest,
  expectedTypes: string[]
): NextResponse | null {
  // Only validate for requests with body
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');

    if (!validateContentType(contentType, expectedTypes)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid content type',
          message: `Content-Type must be one of: ${expectedTypes.join(', ')}`,
        },
        { status: 415 }
      );
    }
  }

  return null;
}

/**
 * Extract and validate authorization header
 */
function extractAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Validate API key from request header (for external integrations)
 */
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');

  // Check if API key is required (based on environment)
  const requiredApiKey = process.env.API_KEY;

  if (!requiredApiKey) {
    // API key not configured, skip validation
    return true;
  }

  if (!apiKey || apiKey !== requiredApiKey) {
    return false;
  }

  return true;
}

/**
 * Main security middleware
 */
export async function applySecurityMiddleware(
  request: NextRequest,
  config: SecurityConfig
): Promise<NextResponse | null> {
  const startTime = Date.now();
  const identifier = getClientIdentifier(request);

  console.log('🔒 Security middleware:', {
    method: request.method,
    url: request.url,
    identifier,
    config,
  });

  try {
    // 1. Validate request method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    const methodError = validateRequestMethod(request, allowedMethods);
    if (methodError) {
      await logSecurityEvent({
        eventType: SecurityEventType.INVALID_REQUEST,
        severity: 'low',
        identifier,
        details: {
          method: request.method,
          url: request.url,
          reason: 'Method not allowed',
        },
      });
      return methodError;
    }

    // 2. Handle OPTIONS requests (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-API-Key',
        },
      });
    }

    // 3. Apply rate limiting
    const rateLimitError = await checkRateLimit(request, config.rateLimitTier);
    if (rateLimitError) {
      await logSecurityEvent({
        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'medium',
        identifier,
        details: {
          tier: config.rateLimitTier,
          url: request.url,
          method: request.method,
        },
      });
      return rateLimitError;
    }

    // 4. Validate content type
    if (config.validateContentType) {
      const contentTypeError = validateRequestContentType(request, config.validateContentType);
      if (contentTypeError) {
        await logSecurityEvent({
          eventType: SecurityEventType.INVALID_REQUEST,
          severity: 'low',
          identifier,
          details: {
            contentType: request.headers.get('content-type'),
            expected: config.validateContentType,
            url: request.url,
          },
        });
        return contentTypeError;
      }
    }

    // 5. Validate API key (if configured)
    if (!validateApiKey(request)) {
      await logSecurityEvent({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        severity: 'high',
        identifier,
        details: {
          url: request.url,
          reason: 'Invalid API key',
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid API key',
        },
        { status: 401 }
      );
    }

    // 6. Validate CSRF token (for mutation requests)
    if (config.requireCsrf) {
      const csrfError = await validateCsrfMiddleware(request);
      if (csrfError) {
        await logSecurityEvent({
          eventType: SecurityEventType.CSRF_VALIDATION_FAILED,
          severity: 'high',
          identifier,
          details: {
            url: request.url,
            method: request.method,
          },
        });
        return csrfError;
      }
    }

    // 7. Check authentication if required
    if (config.requireAuth) {
      const authToken = extractAuthToken(request);
      if (!authToken) {
        await logSecurityEvent({
          eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
          severity: 'medium',
          identifier,
          details: {
            url: request.url,
            reason: 'Missing authentication token',
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required',
          },
          { status: 401 }
        );
      }
    }

    // All security checks passed
    const duration = Date.now() - startTime;
    console.log(`✅ Security checks passed (${duration}ms)`);

    return null; // Continue to handler
  } catch (error) {
    console.error('🚨 Security middleware error:', error);

    await logSecurityEvent({
      eventType: SecurityEventType.SYSTEM_ERROR,
      severity: 'critical',
      identifier,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: request.url,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Security validation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Wrapper to apply complete security to a route handler
 */
export function withSecurity(
  config: SecurityConfig,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Apply security middleware
    const securityError = await applySecurityMiddleware(request, config);
    if (securityError) {
      return applySecurityHeaders(securityError);
    }

    try {
      // Execute handler
      let response = await handler(request, ...args);

      // Apply security headers
      response = applySecurityHeaders(response);

      // Add rate limit headers
      const identifier = getClientIdentifier(request);
      response = addRateLimitHeaders(response, config.rateLimitTier, identifier);

      // Add CSRF token for GET requests (if CSRF protection enabled)
      if (config.requireCsrf && request.method === 'GET') {
        const token = generateCsrfToken();
        response = setCsrfTokenCookie(response, token);
      }

      return response;
    } catch (error) {
      console.error('🚨 Handler error:', error);

      const errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
        },
        { status: 500 }
      );

      return applySecurityHeaders(errorResponse);
    }
  };
}

/**
 * Sanitize request body
 */
export async function sanitizeRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();

    // Apply sanitization
    const sanitized = sanitizeObject(body);

    console.log('🧹 Request body sanitized');

    return sanitized;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Input sanitization failed: ${error.message}`);
    }
    throw new Error('Input sanitization failed');
  }
}
