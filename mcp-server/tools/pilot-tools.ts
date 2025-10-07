/**
 * Air Niugini Pilot Management Tools for Claude Agent SDK
 *
 * Provides tools for querying and managing pilot data through MCP
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../src/lib/supabase-admin';

/**
 * Get all pilots with optional filtering by role or status
 */
export const getPilotsTool = tool({
  name: 'get_pilots',
  description: 'Retrieve all pilots or filter by role (Captain/First Officer) and status',
  parameters: z.object({
    role: z.enum(['Captain', 'First Officer', 'all']).optional().describe('Filter by pilot role'),
    status: z.enum(['Active', 'Inactive', 'all']).optional().describe('Filter by pilot status'),
    include_certifications: z.boolean().optional().describe('Include certification counts'),
  }),
  execute: async ({ role, status, include_certifications }) => {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('pilots')
      .select(
        include_certifications
          ? 'id, employee_id, first_name, last_name, role, status, seniority_number, commencement_date, pilot_checks(count)'
          : 'id, employee_id, first_name, last_name, role, status, seniority_number, commencement_date'
      )
      .order('seniority_number', { ascending: true });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch pilots: ${error.message}`);
    }

    return {
      success: true,
      count: data.length,
      pilots: data,
    };
  },
});

/**
 * Get detailed pilot information by ID or employee ID
 */
export const getPilotDetailsTool = tool({
  name: 'get_pilot_details',
  description:
    'Get comprehensive details for a specific pilot including certifications and qualifications',
  parameters: z.object({
    pilot_id: z.string().optional().describe('Database UUID of the pilot'),
    employee_id: z.string().optional().describe('Air Niugini employee ID'),
  }),
  execute: async ({ pilot_id, employee_id }) => {
    if (!pilot_id && !employee_id) {
      throw new Error('Either pilot_id or employee_id must be provided');
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('pilots')
      .select(
        `
        *,
        pilot_checks(
          id,
          expiry_date,
          last_check_date,
          check_types(
            check_code,
            check_description,
            category
          )
        )
      `
      )
      .single();

    if (pilot_id) {
      query = query.eq('id', pilot_id);
    } else if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch pilot details: ${error.message}`);
    }

    return {
      success: true,
      pilot: data,
    };
  },
});

/**
 * Get seniority list for captains and first officers
 */
export const getSeniorityListTool = tool({
  name: 'get_seniority_list',
  description: 'Get the complete seniority list for all pilots, ordered by seniority number',
  parameters: z.object({
    role: z.enum(['Captain', 'First Officer', 'all']).optional().describe('Filter by role'),
  }),
  execute: async ({ role }) => {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('pilots')
      .select(
        'id, employee_id, first_name, last_name, role, seniority_number, commencement_date, status'
      )
      .not('seniority_number', 'is', null)
      .order('seniority_number', { ascending: true });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch seniority list: ${error.message}`);
    }

    return {
      success: true,
      count: data.length,
      seniority_list: data.map((pilot, index) => ({
        rank: index + 1,
        ...pilot,
      })),
    };
  },
});

/**
 * Search pilots by name or employee ID
 */
export const searchPilotsTool = tool({
  name: 'search_pilots',
  description: 'Search for pilots by name or employee ID',
  parameters: z.object({
    search_term: z.string().describe('Search term for name or employee ID'),
    limit: z.number().optional().describe('Maximum number of results (default: 10)'),
  }),
  execute: async ({ search_term, limit = 10 }) => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, role, status, seniority_number')
      .or(
        `first_name.ilike.%${search_term}%,last_name.ilike.%${search_term}%,employee_id.ilike.%${search_term}%`
      )
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search pilots: ${error.message}`);
    }

    return {
      success: true,
      count: data.length,
      results: data,
    };
  },
});

/**
 * Get fleet statistics and overview
 */
export const getFleetStatsTool = tool({
  name: 'get_fleet_stats',
  description:
    'Get comprehensive fleet statistics including pilot counts, certification status, and compliance metrics',
  parameters: z.object({}),
  execute: async () => {
    const supabase = getSupabaseAdmin();

    // Get pilot counts by role
    const { data: pilots, error: pilotsError } = await supabase
      .from('pilots')
      .select('id, role, status');

    if (pilotsError) {
      throw new Error(`Failed to fetch pilots: ${pilotsError.message}`);
    }

    const captains = pilots.filter((p) => p.role === 'Captain');
    const firstOfficers = pilots.filter((p) => p.role === 'First Officer');
    const activePilots = pilots.filter((p) => p.status === 'Active');

    // Get certification status from view
    const { data: certStats, error: certError } = await supabase
      .from('compliance_dashboard')
      .select('*')
      .single();

    if (certError) {
      throw new Error(`Failed to fetch certification stats: ${certError.message}`);
    }

    return {
      success: true,
      fleet_overview: {
        total_pilots: pilots.length,
        active_pilots: activePilots.length,
        captains: {
          total: captains.length,
          active: captains.filter((p) => p.status === 'Active').length,
        },
        first_officers: {
          total: firstOfficers.length,
          active: firstOfficers.filter((p) => p.status === 'Active').length,
        },
      },
      certification_compliance: certStats,
    };
  },
});
