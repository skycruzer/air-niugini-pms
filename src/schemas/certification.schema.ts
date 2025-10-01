/**
 * @fileoverview Certification Zod Validation Schemas
 * Runtime validation schemas for certification/check data using Zod
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
 * Date string validation (YYYY-MM-DD format)
 */
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date');

/**
 * Optional date string validation
 */
const optionalDateStringSchema = dateStringSchema.optional().or(z.literal(''));

/**
 * Certification status validation
 */
export const certificationStatusSchema = z.enum(['current', 'expiring', 'expired', 'no_date']);

/**
 * Check category validation
 */
export const checkCategorySchema = z.enum([
  'License',
  'Medical',
  'Recurrent Training',
  'Route Check',
  'Line Check',
  'Proficiency Check',
  'Security',
  'Emergency Procedures',
  'Other',
]);

/**
 * Create/Update certification schema
 * Validates data for creating or updating a pilot certification
 */
export const upsertCertificationSchema = z
  .object({
    pilot_id: uuidSchema,
    check_type_id: uuidSchema,
    issue_date: dateStringSchema,
    expiry_date: dateStringSchema,
    notes: z
      .string()
      .max(1000, 'Notes must be 1000 characters or less')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // Validate that expiry_date is after issue_date
      const issueDate = new Date(data.issue_date);
      const expiryDate = new Date(data.expiry_date);
      return expiryDate > issueDate;
    },
    {
      message: 'Expiry date must be after issue date',
      path: ['expiry_date'],
    }
  )
  .refine(
    (data) => {
      // Validate that issue_date is not too far in the past (e.g., 10 years)
      const issueDate = new Date(data.issue_date);
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      return issueDate >= tenYearsAgo;
    },
    {
      message: 'Issue date cannot be more than 10 years in the past',
      path: ['issue_date'],
    }
  )
  .refine(
    (data) => {
      // Validate that expiry_date is not too far in the future (e.g., 10 years)
      const expiryDate = new Date(data.expiry_date);
      const tenYearsFromNow = new Date();
      tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
      return expiryDate <= tenYearsFromNow;
    },
    {
      message: 'Expiry date cannot be more than 10 years in the future',
      path: ['expiry_date'],
    }
  );

/**
 * Update existing certification schema (with ID)
 */
export const updateCertificationSchema = upsertCertificationSchema.extend({
  id: uuidSchema,
});

/**
 * Bulk certification update schema
 * Validates bulk update operations for multiple pilots
 */
export const bulkCertificationUpdateSchema = z
  .object({
    pilot_ids: z
      .array(uuidSchema)
      .min(1, 'At least one pilot must be selected')
      .max(100, 'Cannot update more than 100 pilots at once'),
    certification_data: z.object({
      check_type_id: uuidSchema,
      issue_date: dateStringSchema,
      expiry_date: dateStringSchema,
      notes: z
        .string()
        .max(1000, 'Notes must be 1000 characters or less')
        .optional()
        .or(z.literal('')),
    }),
  })
  .refine(
    (data) => {
      // Validate expiry date is after issue date
      const issueDate = new Date(data.certification_data.issue_date);
      const expiryDate = new Date(data.certification_data.expiry_date);
      return expiryDate > issueDate;
    },
    {
      message: 'Expiry date must be after issue date',
      path: ['certification_data', 'expiry_date'],
    }
  );

/**
 * Certification filter schema
 * Validates filter parameters for certification list queries
 */
export const certificationFilterSchema = z.object({
  pilotSearch: z.string().optional(),
  checkTypeFilter: z.string().optional(),
  categoryFilter: checkCategorySchema.optional().or(z.literal('')),
  statusFilter: certificationStatusSchema.optional().or(z.literal('')),
  expiryDateFrom: optionalDateStringSchema,
  expiryDateTo: optionalDateStringSchema,
  pilotRole: z.enum(['', 'Captain', 'First Officer']).optional(),
});

/**
 * Expiring certifications query parameters
 */
export const expiringCertificationsQuerySchema = z.object({
  daysAhead: z.coerce.number().int().min(1).max(365).optional().default(60),
  role: z.enum(['Captain', 'First Officer']).optional(),
  category: checkCategorySchema.optional(),
  includeExpired: z.coerce.boolean().optional().default(false),
});

/**
 * Certification query parameters schema
 */
export const certificationQuerySchema = z.object({
  pilot_id: uuidSchema.optional(),
  check_type_id: uuidSchema.optional(),
  status: certificationStatusSchema.optional(),
  category: checkCategorySchema.optional(),
  expiryBefore: dateStringSchema.optional(),
  expiryAfter: dateStringSchema.optional(),
  page: z.coerce.number().int().min(0).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['expiry_date', 'issue_date', 'check_code', 'pilot_name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Certification data from database schema
 */
export const certificationDataSchema = z.object({
  id: uuidSchema,
  pilot_id: uuidSchema,
  check_type_id: uuidSchema,
  issue_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Extended certification with relations schema
 */
export const certificationWithRelationsSchema = certificationDataSchema.extend({
  pilots: z
    .object({
      id: uuidSchema,
      employee_id: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      role: z.string(),
    })
    .nullable()
    .optional(),
  check_types: z
    .object({
      id: uuidSchema,
      check_code: z.string(),
      check_description: z.string(),
      category: z.string(),
      validity_days: z.number().nullable(),
    })
    .nullable()
    .optional(),
  status: certificationStatusSchema.optional(),
  days_until_expiry: z.number().nullable().optional(),
});

/**
 * Check type data schema
 */
export const checkTypeDataSchema = z.object({
  id: uuidSchema,
  check_code: z.string(),
  check_description: z.string(),
  category: z.string(),
  validity_days: z.number().int().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Create check type schema
 */
export const createCheckTypeSchema = z.object({
  check_code: z
    .string()
    .min(1, 'Check code is required')
    .max(50, 'Check code must be 50 characters or less')
    .regex(/^[A-Z0-9-_]+$/, 'Check code must be uppercase alphanumeric'),
  check_description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be 200 characters or less'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be 100 characters or less'),
  validity_days: z.coerce.number().int().min(1).max(3650).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).nullable().optional(),
});

/**
 * Update check type schema
 */
export const updateCheckTypeSchema = createCheckTypeSchema.partial().extend({
  id: uuidSchema,
  is_active: z.boolean().optional(),
});

/**
 * Certification statistics schema
 */
export const certificationStatisticsSchema = z.object({
  total: z.number().int().min(0),
  current: z.number().int().min(0),
  expiring: z.number().int().min(0),
  expired: z.number().int().min(0),
  complianceRate: z.number().min(0).max(100),
  expiryBreakdown: z.object({
    next7Days: z.number().int().min(0),
    next14Days: z.number().int().min(0),
    next30Days: z.number().int().min(0),
    next60Days: z.number().int().min(0),
    next90Days: z.number().int().min(0),
  }),
});

/**
 * Type inference helpers
 */
export type UpsertCertificationInput = z.infer<typeof upsertCertificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;
export type BulkCertificationUpdateInput = z.infer<typeof bulkCertificationUpdateSchema>;
export type CertificationFilterInput = z.infer<typeof certificationFilterSchema>;
export type ExpiringCertificationsQueryInput = z.infer<typeof expiringCertificationsQuerySchema>;
export type CertificationQueryInput = z.infer<typeof certificationQuerySchema>;
export type CertificationData = z.infer<typeof certificationDataSchema>;
export type CertificationWithRelations = z.infer<typeof certificationWithRelationsSchema>;
export type CheckTypeData = z.infer<typeof checkTypeDataSchema>;
export type CreateCheckTypeInput = z.infer<typeof createCheckTypeSchema>;
export type UpdateCheckTypeInput = z.infer<typeof updateCheckTypeSchema>;
export type CertificationStatistics = z.infer<typeof certificationStatisticsSchema>;
