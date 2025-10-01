/**
 * Error Handler for Air Niugini Pilot Management System
 *
 * Unified error handling utilities for consistent error management
 * across the application. Integrates with toast service for user feedback.
 */

import { NextResponse } from 'next/server';
import {
  ApiError,
  ApiErrorResponse,
  ApiErrors,
  parseError,
  getUserFriendlyMessage,
  createErrorResponse,
  isApiError,
} from './api-error';
import { toastError, toastWarning } from './toast-service';

/**
 * Handle errors in API routes
 * Returns a properly formatted NextResponse with error details
 *
 * @example
 * export async function POST(request: Request) {
 *   try {
 *     // API logic
 *   } catch (error) {
 *     return handleApiError(error, request.url)
 *   }
 * }
 */
export function handleApiError(error: unknown, path?: string): NextResponse<ApiErrorResponse> {
  const apiError = parseError(error);

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      code: apiError.code,
      message: apiError.message,
      statusCode: apiError.statusCode,
      details: apiError.details,
      path: path || apiError.path,
      stack: apiError.stack,
    });
  } else {
    // Log minimal info in production
    console.error('API Error:', {
      code: apiError.code,
      message: apiError.message,
      path: path || apiError.path,
    });
  }

  // TODO: Send to error tracking service (e.g., Sentry) in production
  // Example: Sentry.captureException(apiError, {
  //   tags: { api_route: path },
  //   level: 'error',
  // })

  const errorResponse = createErrorResponse(apiError, path);

  return NextResponse.json(errorResponse, {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle errors in client components
 * Shows toast notification and optionally logs to console
 *
 * @example
 * try {
 *   await updatePilot(id, data)
 * } catch (error) {
 *   handleClientError(error, 'Failed to update pilot')
 * }
 */
export function handleClientError(
  error: unknown,
  fallbackMessage?: string,
  options?: {
    showToast?: boolean;
    logToConsole?: boolean;
    onError?: (error: ApiError) => void;
  }
): ApiError {
  const { showToast = true, logToConsole = true, onError } = options || {};

  const apiError = parseError(error);
  const message = apiError.message || fallbackMessage || 'An error occurred';

  // Log to console
  if (logToConsole) {
    console.error('Client Error:', {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    });
  }

  // Show toast notification
  if (showToast) {
    // Use warning toast for business rule violations
    if (apiError.statusCode < 500) {
      toastWarning(message);
    } else {
      toastError(message);
    }
  }

  // Custom error handler callback
  if (onError) {
    onError(apiError);
  }

  return apiError;
}

/**
 * Handle async operations with automatic error handling
 * Perfect for wrapping async functions with consistent error handling
 *
 * @example
 * const result = await handleAsync(
 *   () => updatePilot(id, data),
 *   'Failed to update pilot'
 * )
 *
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 */
export async function handleAsync<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
  options?: {
    showToast?: boolean;
    logToConsole?: boolean;
  }
): Promise<{ success: true; data: T } | { success: false; error: ApiError }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const apiError = handleClientError(error, errorMessage, options);
    return { success: false, error: apiError };
  }
}

/**
 * Safe async wrapper that returns null on error
 * Useful for operations where you want to gracefully handle failures
 *
 * @example
 * const pilot = await safeAsync(() => getPilot(id))
 * if (pilot) {
 *   // Use pilot data
 * }
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options?: {
    logToConsole?: boolean;
    onError?: (error: ApiError) => void;
  }
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleClientError(error, undefined, {
      showToast: false,
      logToConsole: options?.logToConsole ?? false,
      onError: options?.onError,
    });
    return null;
  }
}

/**
 * Validate required fields and throw validation error if missing
 *
 * @example
 * validateRequired({ employee_id, first_name, last_name }, [
 *   'employee_id',
 *   'first_name',
 *   'last_name'
 * ])
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw ApiErrors.validationError(`Missing required fields: ${missingFields.join(', ')}`, {
      missingFields,
    });
  }
}

/**
 * Validate and parse request body
 * Returns parsed body or throws validation error
 *
 * @example
 * const body = await validateRequestBody(request, ['pilot_id', 'check_type_id'])
 */
export async function validateRequestBody(
  request: Request,
  requiredFields?: string[]
): Promise<any> {
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    throw ApiErrors.invalidInput('Invalid JSON in request body');
  }

  if (!body || typeof body !== 'object') {
    throw ApiErrors.invalidInput('Request body must be a valid JSON object');
  }

  if (requiredFields && requiredFields.length > 0) {
    validateRequired(body, requiredFields);
  }

  return body;
}

/**
 * Check if user has permission for operation
 * Throws forbidden error if permission check fails
 *
 * @example
 * checkPermission(
 *   user?.role === 'admin',
 *   'Only administrators can delete pilots'
 * )
 */
export function checkPermission(hasPermission: boolean, message?: string): void {
  if (!hasPermission) {
    throw ApiErrors.forbidden(message);
  }
}

/**
 * Check if user is authenticated
 * Throws unauthorized error if not authenticated
 *
 * @example
 * checkAuthenticated(user, 'You must be logged in to access this resource')
 */
export function checkAuthenticated(user: any, message?: string): void {
  if (!user) {
    throw ApiErrors.unauthorized(message);
  }
}

/**
 * Extract error message from fetch response
 * Useful for handling API responses in client components
 *
 * @example
 * const response = await fetch('/api/pilots')
 * if (!response.ok) {
 *   const errorMessage = await extractErrorMessage(response)
 *   throw new Error(errorMessage)
 * }
 */
export async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();

    // Check for our standard error format
    if (data && !data.success && data.error) {
      return data.error.message;
    }

    // Check for message field
    if (data && data.message) {
      return data.message;
    }

    // Fallback to status text
    return response.statusText || 'Request failed';
  } catch (error) {
    // If we can't parse JSON, return status text
    return response.statusText || 'Request failed';
  }
}

/**
 * Create a typed error handler for specific error scenarios
 *
 * @example
 * const handlePilotError = createErrorHandler({
 *   notFound: () => toastError('Pilot not found'),
 *   validation: (details) => toastError(`Invalid data: ${details}`),
 *   default: () => toastError('Failed to process request')
 * })
 *
 * handlePilotError(error)
 */
export function createErrorHandler(handlers: {
  notFound?: (error: ApiError) => void;
  validation?: (error: ApiError) => void;
  unauthorized?: (error: ApiError) => void;
  forbidden?: (error: ApiError) => void;
  database?: (error: ApiError) => void;
  default: (error: ApiError) => void;
}) {
  return (error: unknown) => {
    const apiError = parseError(error);

    switch (apiError.statusCode) {
      case 404:
        if (handlers.notFound) {
          handlers.notFound(apiError);
          break;
        }
        handlers.default(apiError);
        break;

      case 400:
        if (handlers.validation) {
          handlers.validation(apiError);
          break;
        }
        handlers.default(apiError);
        break;

      case 401:
        if (handlers.unauthorized) {
          handlers.unauthorized(apiError);
          break;
        }
        handlers.default(apiError);
        break;

      case 403:
        if (handlers.forbidden) {
          handlers.forbidden(apiError);
          break;
        }
        handlers.default(apiError);
        break;

      case 500:
      case 503:
        if (handlers.database) {
          handlers.database(apiError);
          break;
        }
        handlers.default(apiError);
        break;

      default:
        handlers.default(apiError);
    }
  };
}

/**
 * Retry an async operation with exponential backoff
 *
 * @example
 * const data = await retryAsync(
 *   () => fetchData(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * )
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options || {};

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Export all error utilities as default
 */
export default {
  handleApiError,
  handleClientError,
  handleAsync,
  safeAsync,
  validateRequired,
  validateRequestBody,
  checkPermission,
  checkAuthenticated,
  extractErrorMessage,
  createErrorHandler,
  retryAsync,
  parseError,
  getUserFriendlyMessage,
  isApiError,
  ApiErrors,
};
