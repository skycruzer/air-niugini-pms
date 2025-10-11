/**
 * @fileoverview Authentication middleware for API routes
 * Validates user sessions and enforces role-based access control
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { User } from '@/lib/supabase';

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Validates the current user session from request
 *
 * @param request - Next.js request object
 * @returns Authentication result with user data or error
 */
export async function validateSession(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
      };
    }

    const token = authHeader.substring(7);

    // Use admin client for server-side token validation
    const supabaseAdmin = getSupabaseAdmin();

    // Verify the session token with Supabase (using admin client)
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return {
        success: false,
        error: 'Invalid or expired session',
      };
    }

    // Fetch user details from an_users table (using admin client)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('an_users')
      .select('*')
      .eq('email', authUser.email)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: 'User not found in system',
      };
    }

    return {
      success: true,
      user: userData as User,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Checks if user has required role
 *
 * @param user - User object to check
 * @param requiredRoles - Array of allowed roles
 * @returns True if user has one of the required roles
 */
export function hasRole(user: User, requiredRoles: ('admin' | 'manager')[]): boolean {
  return requiredRoles.includes(user.role);
}

/**
 * Authentication middleware wrapper for API routes
 *
 * @param handler - API route handler function
 * @param options - Middleware options
 * @returns Wrapped handler with authentication
 *
 * @example
 * export const GET = withAuth(
 *   async (request, { user }) => {
 *     // Handler logic with authenticated user
 *     return NextResponse.json({ data: [] });
 *   },
 *   { roles: ['admin', 'manager'] }
 * );
 */
export function withAuth(
  handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>,
  options?: {
    roles?: ('admin' | 'manager')[];
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Validate session
    const authResult = await validateSession(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Check role requirements
    if (options?.roles && !hasRole(authResult.user, options.roles)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      );
    }

    // Call the handler with authenticated user context
    return handler(request, { user: authResult.user });
  };
}

/**
 * Permission helper functions
 */
export const permissions = {
  canCreate: (user: User) => user.role === 'admin',
  canEdit: (user: User) => ['admin', 'manager'].includes(user.role),
  canDelete: (user: User) => user.role === 'admin',
  canApprove: (user: User) => ['admin', 'manager'].includes(user.role),
  canView: (user: User) => ['admin', 'manager'].includes(user.role),
};
