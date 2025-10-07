import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Report Generation API Route
 *
 * POST /api/reports/generate
 * Body: {
 *   reportType: string;
 *   fields: string[];
 *   filters: any[];
 *   groupBy?: string;
 *   sortBy?: string;
 *   sortOrder?: 'asc' | 'desc';
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, fields, filters, groupBy, sortBy, sortOrder = 'asc' } = body;

    if (!reportType || !fields || fields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Report type and fields are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Build query based on report type
    let query: any;
    let tableName = 'pilots';

    switch (reportType) {
      case 'pilots':
        tableName = 'pilots';
        query = supabaseAdmin.from('pilots').select('*');
        break;
      case 'certifications':
        tableName = 'pilot_checks';
        query = supabaseAdmin.from('pilot_checks').select(`
            *,
            pilots (first_name, last_name, employee_id),
            check_types (check_code, check_description, category)
          `);
        break;
      case 'leave':
        tableName = 'leave_requests';
        query = supabaseAdmin.from('leave_requests').select(`
            *,
            pilots (first_name, last_name, employee_id)
          `);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid report type' }, { status: 400 });
    }

    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach((filter: any) => {
        if (filter.field && filter.operator && filter.value) {
          switch (filter.operator) {
            case 'equals':
              query = query.eq(filter.field, filter.value);
              break;
            case 'not_equals':
              query = query.neq(filter.field, filter.value);
              break;
            case 'greater_than':
              query = query.gt(filter.field, filter.value);
              break;
            case 'less_than':
              query = query.lt(filter.field, filter.value);
              break;
            case 'contains':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
          }
        }
      });
    }

    // Apply sorting
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format data based on selected fields
    const formattedData = data?.map((row: any) => {
      const formatted: any = {};
      fields.forEach((field: string) => {
        // Handle nested fields (e.g., pilots.first_name)
        if (field.includes('.')) {
          const parts = field.split('.');
          const parent = parts[0] as string;
          const child = parts[1] as string;
          const parentObj = (row as any)[parent];
          formatted[field] = parentObj?.[child] ?? null;
        } else {
          formatted[field] = row[field] ?? null;
        }
      });
      return formatted;
    });

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        totalRows: formattedData?.length || 0,
        rows: formattedData || [],
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
