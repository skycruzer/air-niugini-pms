/**
 * @fileoverview Zod validation schemas for API request validation
 * Provides comprehensive input validation and sanitization for all API endpoints
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

import { z } from 'zod';

// =============================================================================
// PILOT VALIDATION SCHEMAS
// =============================================================================

/**
 * Pilot creation/update schema
 */
export const pilotSchema = z.object({
  employee_id: z
    .string()
    .min(1, 'Employee ID is required')
    .max(20, 'Employee ID must be 20 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Employee ID must contain only uppercase letters, numbers, and hyphens'),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  middle_name: z
    .string()
    .max(100, 'Middle name must be 100 characters or less')
    .regex(/^[a-zA-Z\s'-]*$/, 'Middle name contains invalid characters')
    .optional(),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  role: z.enum(['Captain', 'First Officer']),
  contract_type: z.string().max(50, 'Contract type must be 50 characters or less').optional(),
  nationality: z.string().max(100, 'Nationality must be 100 characters or less').optional(),
  passport_number: z
    .string()
    .max(50, 'Passport number must be 50 characters or less')
    .regex(/^[A-Z0-9]*$/, 'Passport number must contain only uppercase letters and numbers')
    .optional(),
  passport_expiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Passport expiry must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  commencement_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Commencement date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  is_active: z.boolean().default(true),
  captain_qualifications: z.array(z.string()).optional(),
  qualification_notes: z
    .string()
    .max(500, 'Qualification notes must be 500 characters or less')
    .optional(),
  rhs_captain_expiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'RHS Captain expiry must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
});

/**
 * Pilot ID validation
 */
export const pilotIdSchema = z.object({
  id: z.string().uuid('Invalid pilot ID format'),
});

// =============================================================================
// CERTIFICATION VALIDATION SCHEMAS
// =============================================================================

/**
 * Certification (pilot check) creation/update schema
 */
export const certificationSchema = z.object({
  pilot_id: z.string().uuid('Invalid pilot ID format'),
  check_type_id: z.string().uuid('Invalid check type ID format'),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
});

/**
 * Bulk certification update schema
 */
export const bulkCertificationUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid('Invalid certification ID format'),
        expiry_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
          .nullable(),
      })
    )
    .min(1, 'At least one certification update is required'),
});

/**
 * Certification query parameters
 */
export const certificationQuerySchema = z.object({
  pilot_id: z.string().uuid().optional(),
  check_type_id: z.string().uuid().optional(),
  status: z.enum(['expired', 'expiring', 'current']).optional(),
  days_ahead: z.coerce.number().int().min(1).max(365).optional(),
});

// =============================================================================
// LEAVE REQUEST VALIDATION SCHEMAS
// =============================================================================

/**
 * Leave request creation schema
 */
export const leaveRequestSchema = z
  .object({
    pilot_id: z.string().uuid('Invalid pilot ID format'),
    request_type: z.enum(['RDO', 'WDO', 'ANNUAL', 'SICK']),
    roster_period: z.string().regex(/^RP\d+\/\d{4}$/, 'Roster period must be in format RP##/YYYY'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
    reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  });

/**
 * Leave request approval/denial schema
 */
export const leaveRequestActionSchema = z.object({
  id: z.string().uuid('Invalid leave request ID format'),
  action: z.enum(['approve', 'deny']),
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

// =============================================================================
// CHECK TYPE VALIDATION SCHEMAS
// =============================================================================

/**
 * Check type creation/update schema
 */
export const checkTypeSchema = z.object({
  check_code: z
    .string()
    .min(1, 'Check code is required')
    .max(20, 'Check code must be 20 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Check code must contain only uppercase letters, numbers, and hyphens'),
  check_description: z
    .string()
    .min(1, 'Check description is required')
    .max(200, 'Check description must be 200 characters or less'),
  category: z.string().max(100, 'Category must be 100 characters or less').optional(),
});

// =============================================================================
// ANALYTICS & REPORTING VALIDATION SCHEMAS
// =============================================================================

/**
 * Date range query schema
 */
export const dateRangeSchema = z
  .object({
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    { message: 'End date must be on or after start date', path: ['end_date'] }
  );

/**
 * Report generation schema
 */
export const reportGenerationSchema = z.object({
  report_type: z.enum(['certification_expiry', 'leave_roster', 'compliance', 'pilot_summary']),
  format: z.enum(['pdf', 'csv', 'json']).default('pdf'),
  filters: z
    .object({
      pilot_ids: z.array(z.string().uuid()).optional(),
      roster_period: z
        .string()
        .regex(/^RP\d+\/\d{4}$/)
        .optional(),
      days_ahead: z.coerce.number().int().min(1).max(365).optional(),
    })
    .optional(),
});

// =============================================================================
// PAGINATION & SORTING SCHEMAS
// =============================================================================

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// =============================================================================
// SETTINGS VALIDATION SCHEMAS
// =============================================================================

/**
 * System settings update schema
 */
export const settingsSchema = z.object({
  key: z
    .string()
    .min(1, 'Setting key is required')
    .max(100, 'Setting key must be 100 characters or less')
    .regex(
      /^[a-z0-9_]+$/,
      'Setting key must contain only lowercase letters, numbers, and underscores'
    ),
  value: z.unknown(), // Can be any JSON value
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validates and sanitizes request body against a schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with parsed data or errors
 *
 * @example
 * const result = validateRequest(pilotSchema, requestBody);
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 * const validatedData = result.data;
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string; details?: string[] } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      return {
        success: false,
        error: 'Validation failed',
        details,
      };
    }
    return {
      success: false,
      error: 'Invalid request data',
    };
  }
}

/**
 * Sanitizes string input to prevent XSS attacks
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent SQL injection
    .trim();
}

/**
 * Validates UUID format
 *
 * @param id - String to validate as UUID
 * @returns True if valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
