/**
 * Air Niugini Certification Tracking Tools for Claude Agent SDK
 *
 * Provides tools for managing and querying pilot certifications
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../src/lib/supabase-admin';
import { differenceInDays } from 'date-fns';

/**
 * Get expiring certifications within a specified timeframe
 */
export const getExpiringCertificationsTool = tool({
  name: 'get_expiring_certifications',
  description:
    'Get all certifications expiring within the specified number of days (default: 60 days)',
  parameters: z.object({
    days_ahead: z.number().optional().describe('Number of days to look ahead (default: 60)'),
    category: z.string().optional().describe('Filter by certification category'),
    status: z
      .enum(['expired', 'expiring_soon', 'current', 'all'])
      .optional()
      .describe('Filter by status'),
  }),
  execute: async ({ days_ahead = 60, category, status }) => {
    const supabase = getSupabaseAdmin();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days_ahead);

    let query = supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        last_check_date,
        pilots!inner (
          id,
          employee_id,
          first_name,
          last_name,
          role
        ),
        check_types!inner (
          id,
          check_code,
          check_description,
          category,
          validity_period_days
        )
      `
      )
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true });

    if (category) {
      query = query.eq('check_types.category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch certifications: ${error.message}`);
    }

    // Process and categorize certifications
    const processedData = data.map((cert: any) => {
      const expiryDate = new Date(cert.expiry_date);
      const daysUntilExpiry = differenceInDays(expiryDate, today);

      let certStatus: 'expired' | 'expiring_soon' | 'current';
      if (daysUntilExpiry < 0) {
        certStatus = 'expired';
      } else if (daysUntilExpiry <= 30) {
        certStatus = 'expiring_soon';
      } else {
        certStatus = 'current';
      }

      return {
        ...cert,
        days_until_expiry: daysUntilExpiry,
        status: certStatus,
      };
    });

    // Filter by status if specified
    const filtered =
      status && status !== 'all'
        ? processedData.filter((cert) => cert.status === status)
        : processedData;

    return {
      success: true,
      count: filtered.length,
      certifications: filtered,
      summary: {
        expired: processedData.filter((c) => c.status === 'expired').length,
        expiring_soon: processedData.filter((c) => c.status === 'expiring_soon').length,
        current: processedData.filter((c) => c.status === 'current').length,
      },
    };
  },
});

/**
 * Get all certification types and categories
 */
export const getCheckTypesTool = tool({
  name: 'get_check_types',
  description: 'Get all available certification check types organized by category',
  parameters: z.object({
    category: z.string().optional().describe('Filter by specific category'),
  }),
  execute: async ({ category }) => {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('check_types')
      .select('*')
      .order('category', { ascending: true })
      .order('check_code', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch check types: ${error.message}`);
    }

    // Group by category
    const grouped = data.reduce((acc: any, checkType: any) => {
      if (!acc[checkType.category]) {
        acc[checkType.category] = [];
      }
      acc[checkType.category].push(checkType);
      return acc;
    }, {});

    return {
      success: true,
      total_check_types: data.length,
      categories: Object.keys(grouped),
      check_types: grouped,
    };
  },
});

/**
 * Get certifications for a specific pilot
 */
export const getPilotCertificationsTool = tool({
  name: 'get_pilot_certifications',
  description: 'Get all certifications for a specific pilot with status information',
  parameters: z.object({
    pilot_id: z.string().optional().describe('Database UUID of the pilot'),
    employee_id: z.string().optional().describe('Air Niugini employee ID'),
    include_history: z.boolean().optional().describe('Include historical check dates'),
  }),
  execute: async ({ pilot_id, employee_id, include_history }) => {
    if (!pilot_id && !employee_id) {
      throw new Error('Either pilot_id or employee_id must be provided');
    }

    const supabase = getSupabaseAdmin();

    // First get the pilot
    let pilotQuery = supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, role')
      .single();

    if (pilot_id) {
      pilotQuery = pilotQuery.eq('id', pilot_id);
    } else if (employee_id) {
      pilotQuery = pilotQuery.eq('employee_id', employee_id);
    }

    const { data: pilotData, error: pilotError } = await pilotQuery;

    if (pilotError) {
      throw new Error(`Failed to fetch pilot: ${pilotError.message}`);
    }

    // Get certifications
    const { data: certData, error: certError } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        last_check_date,
        check_types (
          check_code,
          check_description,
          category,
          validity_period_days
        )
      `
      )
      .eq('pilot_id', pilotData.id)
      .order('check_types(category)', { ascending: true });

    if (certError) {
      throw new Error(`Failed to fetch certifications: ${certError.message}`);
    }

    const today = new Date();
    const processedCerts = certData.map((cert: any) => {
      const expiryDate = cert.expiry_date ? new Date(cert.expiry_date) : null;
      const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, today) : null;

      let status: 'expired' | 'expiring_soon' | 'current' | 'no_date';
      if (!expiryDate) {
        status = 'no_date';
      } else if (daysUntilExpiry! < 0) {
        status = 'expired';
      } else if (daysUntilExpiry! <= 30) {
        status = 'expiring_soon';
      } else {
        status = 'current';
      }

      return {
        ...cert,
        days_until_expiry: daysUntilExpiry,
        status,
      };
    });

    return {
      success: true,
      pilot: pilotData,
      certification_count: processedCerts.length,
      certifications: processedCerts,
      summary: {
        expired: processedCerts.filter((c) => c.status === 'expired').length,
        expiring_soon: processedCerts.filter((c) => c.status === 'expiring_soon').length,
        current: processedCerts.filter((c) => c.status === 'current').length,
        no_date: processedCerts.filter((c) => c.status === 'no_date').length,
      },
    };
  },
});

/**
 * Get compliance dashboard metrics
 */
export const getComplianceMetricsTool = tool({
  name: 'get_compliance_metrics',
  description: 'Get comprehensive fleet compliance metrics and certification status overview',
  parameters: z.object({}),
  execute: async () => {
    const supabase = getSupabaseAdmin();

    // Use the compliance_dashboard view
    const { data, error } = await supabase.from('compliance_dashboard').select('*').single();

    if (error) {
      throw new Error(`Failed to fetch compliance metrics: ${error.message}`);
    }

    return {
      success: true,
      compliance_metrics: data,
      compliance_percentage:
        data.total_certifications > 0
          ? Math.round((data.current_certifications / data.total_certifications) * 100)
          : 0,
    };
  },
});

/**
 * Get certification expiry calendar for a date range
 */
export const getCertificationCalendarTool = tool({
  name: 'get_certification_calendar',
  description: 'Get a calendar view of certification expiries for a specific date range',
  parameters: z.object({
    start_date: z.string().describe('Start date in YYYY-MM-DD format'),
    end_date: z.string().describe('End date in YYYY-MM-DD format'),
    group_by: z.enum(['day', 'week', 'month']).optional().describe('Grouping interval'),
  }),
  execute: async ({ start_date, end_date, group_by = 'week' }) => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        expiry_date,
        pilots!inner (first_name, last_name, employee_id, role),
        check_types!inner (check_code, check_description, category)
      `
      )
      .gte('expiry_date', start_date)
      .lte('expiry_date', end_date)
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch certification calendar: ${error.message}`);
    }

    return {
      success: true,
      date_range: { start_date, end_date },
      total_expiries: data.length,
      expiries: data,
    };
  },
});
