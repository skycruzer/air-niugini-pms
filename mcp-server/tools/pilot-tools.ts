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
export const getPilotsTool = tool(
  'get_pilots',
  'Retrieve all pilots or filter by role (Captain/First Officer) and status',
  {
    role: z.enum(['Captain', 'First Officer', 'all']).optional().describe('Filter by pilot role'),
    status: z.enum(['Active', 'Inactive', 'all']).optional().describe('Filter by pilot status'),
    include_certifications: z.boolean().optional().describe('Include certification counts'),
  },
  async ({ role, status, include_certifications }) => {
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
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            count: data.length,
            pilots: data,
          }, null, 2),
        },
      ],
    };
  }
);

/**
 * Get detailed pilot information by ID or employee ID
 */
export const getPilotDetailsTool = tool(
  'get_pilot_details',
  'Get comprehensive details for a specific pilot including certifications and qualifications',
  {
    pilot_id: z.string().optional().describe('Database UUID of the pilot'),
    employee_id: z.string().optional().describe('Air Niugini employee ID'),
  },
  async ({ pilot_id, employee_id }) => {
    if (!pilot_id && !employee_id) {
      throw new Error('Either pilot_id or employee_id must be provided');
    }

    const supabase = getSupabaseAdmin();

    const selectFields = `
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
    `;

    let query = supabase.from('pilots').select(selectFields);

    if (pilot_id) {
      query = query.eq('id', pilot_id);
    } else if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }

    const { data, error } = await query.single();

    if (error) {
      throw new Error(`Failed to fetch pilot details: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            pilot: data,
          }, null, 2),
        },
      ],
    };
  }
);

/**
 * Get pilot seniority list
 */
export const getSeniorityListTool = tool(
  'get_seniority_list',
  'Retrieve the complete seniority list of all pilots ordered by seniority number',
  {
    role: z.enum(['Captain', 'First Officer', 'all']).optional().describe('Filter by pilot role'),
  },
  async ({ role }) => {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, role, seniority_number, commencement_date')
      .order('seniority_number', { ascending: true });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch seniority list: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            count: data.length,
            seniority_list: data,
          }, null, 2),
        },
      ],
    };
  }
);

/**
 * Search pilots by name or employee ID
 */
export const searchPilotsTool = tool(
  'search_pilots',
  'Search for pilots by name or employee ID using fuzzy matching',
  {
    search_term: z.string().describe('Name or employee ID to search for'),
    role: z.enum(['Captain', 'First Officer', 'all']).optional().describe('Filter by pilot role'),
  },
  async ({ search_term, role }) => {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, role, status, seniority_number')
      .or(
        `first_name.ilike.%${search_term}%,last_name.ilike.%${search_term}%,employee_id.ilike.%${search_term}%`
      );

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search pilots: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            count: data.length,
            results: data,
            search_term,
          }, null, 2),
        },
      ],
    };
  }
);

/**
 * Get fleet statistics and metrics
 */
export const getFleetStatsTool = tool(
  'get_fleet_stats',
  'Retrieve comprehensive fleet statistics including pilot counts, averages, and distributions',
  {},
  async () => {
    const supabase = getSupabaseAdmin();

    const { data: pilots, error: pilotsError } = await supabase
      .from('pilots')
      .select('id, role, status, commencement_date');

    if (pilotsError) {
      throw new Error(`Failed to fetch fleet stats: ${pilotsError.message}`);
    }

    const stats = {
      total_pilots: pilots.length,
      by_role: {
        captains: pilots.filter((p) => p.role === 'Captain').length,
        first_officers: pilots.filter((p) => p.role === 'First Officer').length,
      },
      by_status: {
        active: pilots.filter((p) => p.status === 'Active').length,
        inactive: pilots.filter((p) => p.status === 'Inactive').length,
      },
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            statistics: stats,
          }, null, 2),
        },
      ],
    };
  }
);
