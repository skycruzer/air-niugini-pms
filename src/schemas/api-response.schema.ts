/**
 * @fileoverview API Response Zod Validation Schemas
 * Runtime validation schemas for API responses using Zod
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

import { z } from 'zod';

/**
 * UUID validation
 */
const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Standard API response wrapper schema
 * Generic schema for all API responses
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    error: z.string().nullable(),
    metadata: z
      .object({
        totalCount: z.number().int().min(0).optional(),
        page: z.number().int().min(0).optional(),
        pageSize: z.number().int().min(1).optional(),
        executionTime: z.number().min(0).optional(),
        timestamp: z.string().optional(),
      })
      .optional(),
  });

/**
 * API error response schema
 */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  stack: z.string().optional(),
});

/**
 * Standard error response
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  error: z.string(),
  metadata: z
    .object({
      code: z.string().optional(),
      details: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

/**
 * Pagination metadata schema
 */
export const paginationMetadataSchema = z.object({
  totalCount: z.number().int().min(0),
  page: z.number().int().min(0),
  pageSize: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

/**
 * Success response with data
 */
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    error: z.null(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

/**
 * Empty success response (for operations that don't return data)
 */
export const emptySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.null(),
  error: z.null(),
  message: z.string().optional(),
});

/**
 * Dashboard statistics response schema
 */
export const dashboardStatsResponseSchema = z.object({
  success: z.boolean(),
  data: z.null(),
  error: z.string().nullable(),
  pilots: z.object({
    total: z.number().int().min(0),
    active: z.number().int().min(0),
    inactive: z.number().int().min(0),
    captains: z.number().int().min(0),
    firstOfficers: z.number().int().min(0),
  }),
  certifications: z.object({
    total: z.number().int().min(0),
    current: z.number().int().min(0),
    expiring: z.number().int().min(0),
    expired: z.number().int().min(0),
    complianceRate: z.number().min(0).max(100),
  }),
  leave: z.object({
    totalRequests: z.number().int().min(0),
    pending: z.number().int().min(0),
    approved: z.number().int().min(0),
    denied: z.number().int().min(0),
    thisMonth: z.number().int().min(0),
  }),
  recentActivity: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['pilot', 'certification', 'leave']),
      action: z.string(),
      description: z.string(),
      timestamp: z.string(),
    })
  ),
});

/**
 * Bulk operation result schema
 */
export const bulkOperationResultSchema = z.object({
  success: z.number().int().min(0),
  failed: z.number().int().min(0),
  total: z.number().int().min(0),
  errors: z.array(
    z.object({
      id: z.string(),
      identifier: z.string(),
      error: z.string(),
    })
  ),
});

/**
 * File upload response schema
 */
export const fileUploadResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      fileId: z.string(),
      fileName: z.string(),
      fileSize: z.number().int().min(0),
      fileType: z.string(),
      url: z.string().url(),
    })
    .nullable(),
  error: z.string().nullable(),
});

/**
 * Report generation response schema
 */
export const reportGenerationResponseSchema = z.object({
  success: z.boolean(),
  data: z.null(),
  error: z.string().nullable(),
  reportUrl: z.string().url().optional(),
  reportId: z.string().optional(),
  expiresAt: z.string().optional(),
});

/**
 * Login response schema
 */
export const loginResponseSchema = z.object({
  success: z.boolean(),
  data: z.null(),
  error: z.string().nullable(),
  user: z
    .object({
      id: uuidSchema,
      email: z.string().email(),
      full_name: z.string(),
      role: z.enum(['admin', 'manager', 'user']),
      is_active: z.boolean(),
    })
    .optional(),
  session: z
    .object({
      access_token: z.string(),
      refresh_token: z.string(),
      expires_at: z.number().int(),
    })
    .optional(),
});

/**
 * Validation error response schema
 * Used for form validation errors
 */
export const validationErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  error: z.string(),
  validationErrors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      type: z.string().optional(),
    })
  ),
});

/**
 * Health check response schema
 */
export const healthCheckResponseSchema = z.object({
  success: z.boolean(),
  status: z.enum(['healthy', 'degraded', 'down']),
  services: z.object({
    database: z.enum(['connected', 'disconnected', 'slow']),
    api: z.enum(['operational', 'degraded', 'down']),
    auth: z.enum(['operational', 'degraded', 'down']),
  }),
  timestamp: z.string(),
  responseTime: z.number().min(0),
});

/**
 * Chart data response schema
 */
export const chartDataResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      labels: z.array(z.string()),
      datasets: z.array(
        z.object({
          label: z.string(),
          data: z.array(z.number()),
          backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
          borderColor: z.union([z.string(), z.array(z.string())]).optional(),
          borderWidth: z.number().optional(),
        })
      ),
    })
    .nullable(),
  error: z.string().nullable(),
});

/**
 * Analytics query result schema
 */
export const analyticsResultSchema = z.object({
  success: z.boolean(),
  data: z.array(z.record(z.string(), z.unknown())).nullable(),
  error: z.string().nullable(),
  metadata: z
    .object({
      totalRecords: z.number().int().min(0),
      executionTime: z.number().min(0),
      cacheUsed: z.boolean(),
      lastUpdated: z.string(),
    })
    .optional(),
});

/**
 * Settings update response schema
 */
export const settingsUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      key: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
      description: z.string().nullable(),
    })
    .nullable(),
  error: z.string().nullable(),
});

/**
 * Type inference helpers
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  metadata?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
    executionTime?: number;
    timestamp?: string;
  };
};

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;
export type EmptySuccessResponse = z.infer<typeof emptySuccessResponseSchema>;
export type DashboardStatsResponse = z.infer<typeof dashboardStatsResponseSchema>;
export type BulkOperationResult = z.infer<typeof bulkOperationResultSchema>;
export type FileUploadResponse = z.infer<typeof fileUploadResponseSchema>;
export type ReportGenerationResponse = z.infer<typeof reportGenerationResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type ValidationErrorResponse = z.infer<typeof validationErrorResponseSchema>;
export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
export type ChartDataResponse = z.infer<typeof chartDataResponseSchema>;
export type AnalyticsResult = z.infer<typeof analyticsResultSchema>;
export type SettingsUpdateResponse = z.infer<typeof settingsUpdateResponseSchema>;

/**
 * Helper function to create typed API response
 */
export function createApiResponse<T>(
  success: boolean,
  data: T | null = null,
  error: string | null = null,
  metadata?: Record<string, unknown>
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    metadata,
  };
}

/**
 * Helper function to create error response
 */
export function createErrorResponse(error: string, code?: string): ErrorResponse {
  return {
    success: false,
    data: null,
    error,
    metadata: code ? { code } : undefined,
  };
}

/**
 * Helper function to create success response
 */
export function createSuccessResponse<T>(
  data: T,
  metadata?: Record<string, unknown>
): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    metadata,
  };
}
