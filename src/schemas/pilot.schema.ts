/**
 * @fileoverview Pilot Zod Validation Schemas
 * Runtime validation schemas for pilot data using Zod
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

import { z } from 'zod';

/**
 * Employee ID validation
 * Format: Must be alphanumeric, 3-20 characters
 */
export const employeeIdSchema = z
  .string()
  .min(1, 'Employee ID is required')
  .max(20, 'Employee ID must be 20 characters or less')
  .regex(/^[A-Za-z0-9-_]+$/, 'Employee ID must be alphanumeric');

/**
 * Pilot role validation
 */
export const pilotRoleSchema = z.enum(['Captain', 'First Officer'], {
  message: 'Role must be either Captain or First Officer',
});

/**
 * Captain qualifications validation
 */
export const captainQualificationsSchema = z
  .array(z.enum(['Line Captain', 'Training Captain', 'Examiner']))
  .optional();

/**
 * Date string validation (YYYY-MM-DD format)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date');

/**
 * Optional date string validation
 */
export const optionalDateStringSchema = dateStringSchema.optional().or(z.literal(''));

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Create pilot schema
 * Validates data for creating a new pilot
 */
export const createPilotSchema = z
  .object({
    employee_id: employeeIdSchema,
    first_name: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be 100 characters or less')
      .trim(),
    last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be 100 characters or less')
      .trim(),
    role: pilotRoleSchema,
    contract_type_id: uuidSchema.optional().or(z.literal('')),
    commencement_date: optionalDateStringSchema,
    date_of_birth: optionalDateStringSchema,
    captain_qualifications: captainQualificationsSchema,
    notes: z
      .string()
      .max(1000, 'Notes must be 1000 characters or less')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // If role is Captain, captain_qualifications can be present
      // If role is First Officer, captain_qualifications should be empty
      if (
        data.role === 'First Officer' &&
        data.captain_qualifications &&
        data.captain_qualifications.length > 0
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'First Officers cannot have captain qualifications',
      path: ['captain_qualifications'],
    }
  )
  .refine(
    (data) => {
      // Validate date_of_birth is not in the future
      if (data.date_of_birth && data.date_of_birth !== '') {
        const dob = new Date(data.date_of_birth);
        return dob < new Date();
      }
      return true;
    },
    {
      message: 'Date of birth cannot be in the future',
      path: ['date_of_birth'],
    }
  )
  .refine(
    (data) => {
      // Validate commencement_date is not in the future
      if (data.commencement_date && data.commencement_date !== '') {
        const commencementDate = new Date(data.commencement_date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Allow today
        return commencementDate <= today;
      }
      return true;
    },
    {
      message: 'Commencement date cannot be in the future',
      path: ['commencement_date'],
    }
  )
  .refine(
    (data) => {
      // Validate age if date_of_birth is provided (must be at least 18 years old)
      if (data.date_of_birth && data.date_of_birth !== '') {
        const dob = new Date(data.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        return age >= 18;
      }
      return true;
    },
    {
      message: 'Pilot must be at least 18 years old',
      path: ['date_of_birth'],
    }
  );

/**
 * Update pilot schema
 * Validates data for updating an existing pilot
 */
export const updatePilotSchema = createPilotSchema.partial().extend({
  id: uuidSchema,
  is_active: z.boolean().optional(),
});

/**
 * Pilot filter schema
 * Validates filter parameters for pilot list queries
 */
export const pilotFilterSchema = z.object({
  searchTerm: z.string().optional(),
  roleFilter: z.enum(['', 'Captain', 'First Officer']).optional(),
  statusFilter: z.enum(['', 'active', 'inactive']).optional(),
  contractTypeFilter: z.string().optional(),
  seniorityMin: z.string().optional(),
  seniorityMax: z.string().optional(),
  ageMin: z.string().optional(),
  ageMax: z.string().optional(),
});

/**
 * Pilot ID schema
 * Validates a single pilot ID
 */
export const pilotIdSchema = z.object({
  id: uuidSchema,
});

/**
 * Pilot IDs schema
 * Validates an array of pilot IDs
 */
export const pilotIdsSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'At least one pilot ID is required'),
});

/**
 * Pilot bulk action schema
 * Validates bulk action requests
 */
export const pilotBulkActionSchema = z.object({
  pilot_ids: z.array(uuidSchema).min(1, 'At least one pilot must be selected'),
  action: z.enum(['activate', 'deactivate', 'export', 'delete']),
  confirm: z.boolean().refine((val) => val === true, 'Action must be confirmed'),
});

/**
 * Pilot query parameters schema
 * Validates query parameters for pilot list endpoint
 */
export const pilotQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z
    .enum(['employee_id', 'first_name', 'last_name', 'role', 'seniority_number', 'age'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  role: z.enum(['Captain', 'First Officer']).optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  contractType: z.string().uuid().optional(),
});

/**
 * Pilot data from database schema
 * Validates pilot data structure from database queries
 */
export const pilotDataSchema = z.object({
  id: uuidSchema,
  employee_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: pilotRoleSchema,
  contract_type_id: uuidSchema.nullable(),
  commencement_date: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  retirement_date: z.string().nullable(),
  age: z.number().nullable(),
  seniority_number: z.number().int().nullable(),
  is_active: z.boolean(),
  captain_qualifications: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Type inference helpers
 */
export type CreatePilotInput = z.infer<typeof createPilotSchema>;
export type UpdatePilotInput = z.infer<typeof updatePilotSchema>;
export type PilotFilterInput = z.infer<typeof pilotFilterSchema>;
export type PilotBulkActionInput = z.infer<typeof pilotBulkActionSchema>;
export type PilotQueryInput = z.infer<typeof pilotQuerySchema>;
export type PilotData = z.infer<typeof pilotDataSchema>;
