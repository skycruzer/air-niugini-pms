/**
 * @fileoverview Unified API Response Format
 * Standardizes all API responses across the application for consistency
 *
 * @author Air Niugini Development Team
 * @version 2.0.0
 */

import { NextResponse } from 'next/server';

/**
 * Standard success response type
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

/**
 * Standard error response type
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string; // Only in development
  };
  meta?: {
    timestamp: string;
  };
}

/**
 * Combined API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard error codes
 */
export enum ApiErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Custom errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * HTTP status codes mapped to error codes
 */
const ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.VALIDATION_ERROR]: 422,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.DATABASE_ERROR]: 500,
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ApiErrorCode.AUTHENTICATION_FAILED]: 401,
  [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
};

/**
 * Create a success response
 *
 * @example
 * return apiSuccess({ pilots: data }, 'Pilots retrieved successfully', { total: 27 });
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  meta?: Omit<ApiSuccessResponse<T>['meta'], 'timestamp'>
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, { status: 200 });
}

/**
 * Create an error response
 *
 * @example
 * return apiError(ApiErrorCode.NOT_FOUND, 'Pilot not found', { pilotId });
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
  customStatus?: number
): NextResponse<ApiErrorResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const status = customStatus || ERROR_STATUS_MAP[code] || 500;

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details: isDevelopment ? details : undefined,
      stack: isDevelopment && details instanceof Error ? details.stack : undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  // Log errors server-side
  console.error(`[API Error ${code}]:`, message, details);

  return NextResponse.json(response, { status });
}

/**
 * Create a validation error response
 *
 * @example
 * return apiValidationError({ email: 'Invalid email format' });
 */
export function apiValidationError(
  errors: Record<string, string | string[]>
): NextResponse<ApiErrorResponse> {
  return apiError(
    ApiErrorCode.VALIDATION_ERROR,
    'Validation failed',
    { fields: errors }
  );
}

/**
 * Create an unauthorized error response
 */
export function apiUnauthorized(
  message = 'Authentication required'
): NextResponse<ApiErrorResponse> {
  return apiError(ApiErrorCode.UNAUTHORIZED, message);
}

/**
 * Create a forbidden error response
 */
export function apiForbidden(
  message = 'Insufficient permissions'
): NextResponse<ApiErrorResponse> {
  return apiError(ApiErrorCode.FORBIDDEN, message);
}

/**
 * Create a not found error response
 */
export function apiNotFound(
  resource: string,
  id?: string
): NextResponse<ApiErrorResponse> {
  const message = id
    ? `${resource} with ID '${id}' not found`
    : `${resource} not found`;
  return apiError(ApiErrorCode.NOT_FOUND, message);
}

/**
 * Wrap async API handlers with error handling
 *
 * @example
 * export const GET = withErrorHandling(async (req) => {
 *   const data = await fetchPilots();
 *   return apiSuccess(data);
 * });
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('Unhandled API error:', error);

      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('not found')) {
          return apiError(ApiErrorCode.NOT_FOUND, error.message, error);
        }
        if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          return apiError(ApiErrorCode.FORBIDDEN, error.message, error);
        }
        if (error.message.includes('validation')) {
          return apiError(ApiErrorCode.VALIDATION_ERROR, error.message, error);
        }
      }

      // Default to internal error
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred',
        error
      );
    }
  }) as T;
}

/**
 * Type guard to check if response is success
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is error
 */
export function isApiError(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}
