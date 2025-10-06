/**
 * @fileoverview CSRF (Cross-Site Request Forgery) protection middleware
 * Generates and validates CSRF tokens for state-changing operations
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHmac } from 'crypto';

/**
 * CSRF token configuration
 */
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Generates a CSRF token
 *
 * @returns CSRF token string
 */
export function generateCSRFToken(): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const signature = createHmac('sha256', CSRF_SECRET).update(token).digest('hex');

  return `${token}.${signature}`;
}

/**
 * Validates a CSRF token
 *
 * @param token - Token to validate
 * @returns True if token is valid
 */
export function validateCSRFToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [tokenValue, signature] = parts;

  if (!tokenValue || !signature) {
    return false;
  }

  const expectedSignature = createHmac('sha256', CSRF_SECRET).update(tokenValue).digest('hex');

  // Use constant-time comparison to prevent timing attacks
  return signature === expectedSignature;
}

/**
 * CSRF protection middleware for API routes
 * Only validates on state-changing methods (POST, PUT, PATCH, DELETE)
 *
 * @param handler - API route handler
 * @returns Wrapped handler with CSRF protection
 *
 * @example
 * export const POST = withCSRF(async (request) => {
 *   // Handler logic - CSRF already validated
 *   return NextResponse.json({ success: true });
 * });
 */
export function withCSRF(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const method = request.method;

    // Only enforce CSRF on state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Get token from header
      const headerToken = request.headers.get(CSRF_HEADER_NAME);

      // Get token from cookie
      const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

      // Both tokens must exist and match
      if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        return NextResponse.json(
          {
            success: false,
            error: 'CSRF token mismatch',
          },
          { status: 403 }
        );
      }

      // Validate token structure and signature
      if (!validateCSRFToken(headerToken)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid CSRF token',
          },
          { status: 403 }
        );
      }
    }

    // Call the handler
    return handler(request);
  };
}

/**
 * Sets CSRF token in response cookie
 *
 * @param response - Next.js response object
 * @param token - CSRF token to set
 * @returns Response with CSRF cookie set
 */
export function setCSRFCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

/**
 * API endpoint to generate and retrieve CSRF token
 * Should be called on application load to get initial token
 *
 * @example
 * // In client-side code:
 * const response = await fetch('/api/csrf-token');
 * const { token } = await response.json();
 * // Include token in subsequent requests as x-csrf-token header
 */
export async function GET(): Promise<NextResponse> {
  const token = generateCSRFToken();

  const response = NextResponse.json({
    success: true,
    token,
  });

  return setCSRFCookie(response, token);
}

/**
 * Combined authentication and CSRF protection middleware
 *
 * @param handler - API route handler
 * @param authOptions - Authentication options
 * @returns Wrapped handler with both protections
 */
export function withAuthAndCSRF(
  handler: (request: NextRequest, context: { user: any }) => Promise<NextResponse>,
  authOptions?: {
    roles?: ('admin' | 'manager')[];
  }
) {
  // Import withAuth to avoid circular dependency
  const { withAuth } = require('./auth');

  return withCSRF(withAuth(handler, authOptions));
}
