/**
 * API Error Types and Handling for Air Niugini Pilot Management System
 *
 * Provides standardized error types, error creation, and error parsing
 * for consistent error handling across API routes and client code.
 */

/**
 * Standard API error codes
 */
export enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Resource
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  PILOT_NOT_FOUND = 'PILOT_NOT_FOUND',
  CERTIFICATION_NOT_FOUND = 'CERTIFICATION_NOT_FOUND',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',

  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  ROSTER_PERIOD_CONFLICT = 'ROSTER_PERIOD_CONFLICT',
  CERTIFICATION_EXPIRED = 'CERTIFICATION_EXPIRED',

  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
  };
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  metadata?: {
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: any;
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly path?: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    path?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.path = path;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Convert ApiError to API response format
   */
  toResponse(): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
        path: this.path,
      },
    };
  }
}

/**
 * Factory functions for common API errors
 */
export const ApiErrors = {
  // Authentication & Authorization
  unauthorized(message: string = 'Authentication required'): ApiError {
    return new ApiError(ApiErrorCode.UNAUTHORIZED, message, 401);
  },

  forbidden(message: string = 'You do not have permission to access this resource'): ApiError {
    return new ApiError(ApiErrorCode.FORBIDDEN, message, 403);
  },

  sessionExpired(message: string = 'Your session has expired. Please log in again.'): ApiError {
    return new ApiError(ApiErrorCode.SESSION_EXPIRED, message, 401);
  },

  invalidCredentials(message: string = 'Invalid email or password'): ApiError {
    return new ApiError(ApiErrorCode.INVALID_CREDENTIALS, message, 401);
  },

  // Validation
  validationError(message: string, details?: any): ApiError {
    return new ApiError(ApiErrorCode.VALIDATION_ERROR, message, 400, details);
  },

  invalidInput(message: string, details?: any): ApiError {
    return new ApiError(ApiErrorCode.INVALID_INPUT, message, 400, details);
  },

  missingField(fieldName: string): ApiError {
    return new ApiError(
      ApiErrorCode.MISSING_REQUIRED_FIELD,
      `Required field is missing: ${fieldName}`,
      400,
      { field: fieldName }
    );
  },

  duplicateEntry(message: string = 'This entry already exists', details?: any): ApiError {
    return new ApiError(ApiErrorCode.DUPLICATE_ENTRY, message, 409, details);
  },

  // Resource
  notFound(resource: string = 'Resource', id?: string | number): ApiError {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    return new ApiError(ApiErrorCode.NOT_FOUND, message, 404);
  },

  pilotNotFound(employeeId?: string): ApiError {
    const message = employeeId
      ? `Pilot with Employee ID ${employeeId} not found`
      : 'Pilot not found';
    return new ApiError(ApiErrorCode.PILOT_NOT_FOUND, message, 404);
  },

  certificationNotFound(id?: string): ApiError {
    const message = id ? `Certification with ID ${id} not found` : 'Certification not found';
    return new ApiError(ApiErrorCode.CERTIFICATION_NOT_FOUND, message, 404);
  },

  // Database
  databaseError(message: string = 'Database operation failed', details?: any): ApiError {
    return new ApiError(ApiErrorCode.DATABASE_ERROR, message, 500, details);
  },

  queryError(message: string = 'Database query failed', details?: any): ApiError {
    return new ApiError(ApiErrorCode.QUERY_ERROR, message, 500, details);
  },

  connectionError(message: string = 'Database connection failed'): ApiError {
    return new ApiError(ApiErrorCode.CONNECTION_ERROR, message, 503);
  },

  // Business Logic
  businessRuleViolation(message: string, details?: any): ApiError {
    return new ApiError(ApiErrorCode.BUSINESS_RULE_VIOLATION, message, 400, details);
  },

  rosterPeriodConflict(message: string = 'Leave request conflicts with roster period'): ApiError {
    return new ApiError(ApiErrorCode.ROSTER_PERIOD_CONFLICT, message, 400);
  },

  certificationExpired(checkType: string): ApiError {
    return new ApiError(
      ApiErrorCode.CERTIFICATION_EXPIRED,
      `${checkType} certification has expired`,
      400
    );
  },

  // System
  internalError(message: string = 'An internal server error occurred', details?: any): ApiError {
    return new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, message, 500, details);
  },

  serviceUnavailable(message: string = 'Service temporarily unavailable'): ApiError {
    return new ApiError(ApiErrorCode.SERVICE_UNAVAILABLE, message, 503);
  },

  networkError(message: string = 'Network error occurred'): ApiError {
    return new ApiError(ApiErrorCode.NETWORK_ERROR, message, 503);
  },

  // Rate Limiting
  rateLimitExceeded(message: string = 'Too many requests. Please try again later.'): ApiError {
    return new ApiError(ApiErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
  },

  // Unknown
  unknown(message: string = 'An unknown error occurred', details?: any): ApiError {
    return new ApiError(ApiErrorCode.UNKNOWN_ERROR, message, 500, details);
  },
};

/**
 * Check if an error is an ApiError instance
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Parse any error into a standardized ApiError
 */
export function parseError(error: unknown, defaultMessage: string = 'An error occurred'): ApiError {
  // Already an ApiError
  if (isApiError(error)) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return ApiErrors.internalError(error.message || defaultMessage, {
      originalError: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  // Supabase error
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; code?: string; details?: string };
    return ApiErrors.databaseError(supabaseError.message, {
      code: supabaseError.code,
      details: supabaseError.details,
    });
  }

  // String error
  if (typeof error === 'string') {
    return ApiErrors.internalError(error);
  }

  // Unknown error type
  return ApiErrors.unknown(defaultMessage, { error });
}

/**
 * Create a user-friendly error message from an error
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  metadata?: ApiSuccessResponse['metadata']
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    metadata,
  };
}

/**
 * Create an error response from any error
 */
export function createErrorResponse(error: unknown, path?: string): ApiErrorResponse {
  const apiError = parseError(error);
  if (path && !apiError.path) {
    // Create new ApiError with path if not already set
    const newError = new ApiError(
      apiError.code,
      apiError.message,
      apiError.statusCode,
      apiError.details,
      path
    );
    return newError.toResponse();
  }
  return apiError.toResponse();
}
