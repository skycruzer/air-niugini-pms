/**
 * @fileoverview Leave Request Zod Validation Schemas
 * Runtime validation schemas for leave request data using Zod
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
 * Leave type validation
 */
export const leaveTypeSchema = z.enum(['RDO', 'WDO', 'Annual', 'Sick', 'Emergency'], {
  message: 'Invalid leave type',
});

/**
 * Leave status validation
 */
export const leaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'DENIED'], {
  message: 'Invalid leave status',
});

/**
 * Roster period validation
 * Format: RP[number]/[year] (e.g., RP11/2025)
 */
export const rosterPeriodSchema = z
  .string()
  .regex(
    /^RP\d{1,2}\/\d{4}$/,
    'Roster period must be in format RP[number]/[year] (e.g., RP11/2025)'
  );

/**
 * Create leave request schema
 * Validates data for creating a new leave request
 */
export const createLeaveRequestSchema = z
  .object({
    pilot_id: uuidSchema,
    leave_type: leaveTypeSchema,
    start_date: dateStringSchema,
    end_date: dateStringSchema,
    reason: z
      .string()
      .max(500, 'Reason must be 500 characters or less')
      .optional()
      .or(z.literal('')),
    comments: z
      .string()
      .max(1000, 'Comments must be 1000 characters or less')
      .optional()
      .or(z.literal('')),
    roster_period: rosterPeriodSchema.optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Validate that end_date is after or equal to start_date
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate >= startDate;
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // Validate that leave duration is not more than 90 days
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    },
    {
      message: 'Leave duration cannot exceed 90 days',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      // Validate that start_date is not too far in the past (e.g., 30 days)
      const startDate = new Date(data.start_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return startDate >= thirtyDaysAgo;
    },
    {
      message: 'Start date cannot be more than 30 days in the past',
      path: ['start_date'],
    }
  )
  .refine(
    (data) => {
      // Validate that start_date is not too far in the future (e.g., 1 year)
      const startDate = new Date(data.start_date);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return startDate <= oneYearFromNow;
    },
    {
      message: 'Start date cannot be more than 1 year in the future',
      path: ['start_date'],
    }
  );

/**
 * Update leave request schema
 * Validates data for updating an existing leave request
 */
export const updateLeaveRequestSchema = createLeaveRequestSchema.partial().extend({
  id: uuidSchema,
});

/**
 * Update leave status schema
 * Validates data for approving/denying leave requests
 */
export const updateLeaveStatusSchema = z
  .object({
    id: uuidSchema,
    status: z.enum(['APPROVED', 'DENIED']),
    review_comments: z
      .string()
      .max(1000, 'Review comments must be 1000 characters or less')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // Require comments when denying
      if (data.status === 'DENIED' && (!data.review_comments || data.review_comments === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'Review comments are required when denying a leave request',
      path: ['review_comments'],
    }
  );

/**
 * Leave conflict check schema
 * Validates parameters for checking leave conflicts
 */
export const leaveConflictCheckSchema = z
  .object({
    pilot_id: uuidSchema,
    start_date: dateStringSchema,
    end_date: dateStringSchema,
    exclude_request_id: uuidSchema.optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate >= startDate;
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  );

/**
 * Leave filter schema
 * Validates filter parameters for leave request list queries
 */
export const leaveFilterSchema = z.object({
  pilotSearch: z.string().optional(),
  leaveTypeFilter: leaveTypeSchema.optional().or(z.literal('')),
  statusFilter: leaveStatusSchema.optional().or(z.literal('')),
  rosterPeriodFilter: rosterPeriodSchema.optional().or(z.literal('')),
  dateFrom: dateStringSchema.optional().or(z.literal('')),
  dateTo: dateStringSchema.optional().or(z.literal('')),
  pilotRole: z.enum(['', 'Captain', 'First Officer']).optional(),
});

/**
 * Leave query parameters schema
 */
export const leaveQuerySchema = z.object({
  pilot_id: uuidSchema.optional(),
  leave_type: leaveTypeSchema.optional(),
  status: leaveStatusSchema.optional(),
  roster_period: rosterPeriodSchema.optional(),
  start_date_from: dateStringSchema.optional(),
  start_date_to: dateStringSchema.optional(),
  page: z.coerce.number().int().min(0).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['start_date', 'end_date', 'leave_type', 'status', 'created_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Leave request data from database schema
 */
export const leaveRequestDataSchema = z.object({
  id: uuidSchema,
  pilot_id: uuidSchema,
  leave_type: leaveTypeSchema,
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().nullable(),
  comments: z.string().nullable(),
  status: leaveStatusSchema,
  reviewed_by: uuidSchema.nullable(),
  reviewed_at: z.string().nullable(),
  review_comments: z.string().nullable(),
  roster_period: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Extended leave request with relations schema
 */
export const leaveRequestWithRelationsSchema = leaveRequestDataSchema.extend({
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
  reviewers: z
    .object({
      id: uuidSchema,
      email: z.string().email(),
      full_name: z.string(),
    })
    .nullable()
    .optional(),
});

/**
 * Leave conflict schema
 */
export const leaveConflictSchema = z.object({
  type: z.enum(['leave_overlap', 'certification_gap', 'scheduling_conflict']),
  severity: z.enum(['warning', 'error']),
  message: z.string(),
  conflicting_dates: z.array(z.string()),
  conflicting_request: leaveRequestDataSchema.optional(),
});

/**
 * Leave conflict check response schema
 */
export const leaveConflictCheckResponseSchema = z.object({
  has_conflicts: z.boolean(),
  conflicts: z.array(leaveConflictSchema),
});

/**
 * Leave statistics schema
 */
export const leaveStatisticsSchema = z.object({
  totalRequests: z.number().int().min(0),
  pending: z.number().int().min(0),
  approved: z.number().int().min(0),
  denied: z.number().int().min(0),
  thisMonth: z.number().int().min(0),
  lastMonth: z.number().int().min(0),
  typeBreakdown: z.object({
    RDO: z.number().int().min(0),
    WDO: z.number().int().min(0),
    Annual: z.number().int().min(0),
    Sick: z.number().int().min(0),
    Emergency: z.number().int().min(0),
  }),
});

/**
 * Roster period data schema
 */
export const rosterPeriodDataSchema = z.object({
  code: rosterPeriodSchema,
  number: z.number().int().min(1).max(13),
  year: z.number().int().min(2020).max(2100),
  start_date: z.date(),
  end_date: z.date(),
});

/**
 * Type inference helpers
 */
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>;
export type UpdateLeaveStatusInput = z.infer<typeof updateLeaveStatusSchema>;
export type LeaveConflictCheckInput = z.infer<typeof leaveConflictCheckSchema>;
export type LeaveFilterInput = z.infer<typeof leaveFilterSchema>;
export type LeaveQueryInput = z.infer<typeof leaveQuerySchema>;
export type LeaveRequestData = z.infer<typeof leaveRequestDataSchema>;
export type LeaveRequestWithRelations = z.infer<typeof leaveRequestWithRelationsSchema>;
export type LeaveConflict = z.infer<typeof leaveConflictSchema>;
export type LeaveConflictCheckResponse = z.infer<typeof leaveConflictCheckResponseSchema>;
export type LeaveStatistics = z.infer<typeof leaveStatisticsSchema>;
export type RosterPeriodData = z.infer<typeof rosterPeriodDataSchema>;
