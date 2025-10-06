/**
 * @fileoverview CSRF token generation endpoint
 * Provides CSRF tokens for client-side applications
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { GET as generateCSRFToken } from '@/middleware/csrf';

/**
 * GET /api/csrf-token
 * Generates and returns a CSRF token for the client
 *
 * @returns JSON response with CSRF token
 */
export { generateCSRFToken as GET };
