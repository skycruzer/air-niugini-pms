import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { differenceInDays, format } from 'date-fns';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/fleet-certifications
 *
 * Consolidated endpoint for fleet certification analytics
 * Replaces multiple duplicate endpoints with a single optimized query
 *
 * Query params:
 * - timeframe: number of days ahead for expiry analysis (default: 30)
 * - includeDetails: boolean to include detailed certification list (default: false)
 * - groupBy: 'category' | 'pilot' | 'status' (default: 'status')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = parseInt(searchParams.get('timeframe') || '30');
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const groupBy = searchParams.get('groupBy') || 'status';

    const supabase = getSupabaseAdmin();

    // Fetch all pilot checks with related data
    const { data: checks, error } = await supabase
      .from('pilot_checks')
      .select(`
        id,
        expiry_date,
        pilots!inner (
          id,
          first_name,
          last_name,
          employee_id,
          role,
          is_active
        ),
        check_types!inner (
          id,
          check_code,
          check_description,
          category
        )
      `)
      .eq('pilots.is_active', true)
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching certifications:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch certification data' },
        { status: 500 }
      );
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + timeframe);

    // Calculate statistics
    const stats = {
      total: checks?.length || 0,
      current: 0,
      expiring: 0,
      expired: 0,
      noDate: 0,
    };

    const expiringList: any[] = [];
    const expiredList: any[] = [];
    const byCategory: Record<string, any> = {};
    const byPilot: Record<string, any> = {};

    checks?.forEach((check: any) => {
      const category = check.check_types?.category || 'Unknown';
      const pilotId = check.pilots?.id;
      const pilotName = `${check.pilots?.first_name} ${check.pilots?.last_name}`;

      // Initialize category if not exists
      if (!byCategory[category]) {
        byCategory[category] = { total: 0, current: 0, expiring: 0, expired: 0, noDate: 0 };
      }

      // Initialize pilot if not exists
      if (!byPilot[pilotId]) {
        byPilot[pilotId] = {
          id: pilotId,
          name: pilotName,
          employeeId: check.pilots?.employee_id,
          role: check.pilots?.role,
          total: 0,
          current: 0,
          expiring: 0,
          expired: 0,
          noDate: 0,
        };
      }

      // Process expiry status
      if (!check.expiry_date) {
        stats.noDate++;
        byCategory[category].noDate++;
        byPilot[pilotId].noDate++;
      } else {
        const expiryDate = new Date(check.expiry_date);
        const daysUntilExpiry = differenceInDays(expiryDate, today);

        if (daysUntilExpiry < 0) {
          stats.expired++;
          byCategory[category].expired++;
          byPilot[pilotId].expired++;

          if (includeDetails) {
            expiredList.push({
              id: check.id,
              pilotName,
              employeeId: check.pilots?.employee_id,
              checkCode: check.check_types?.check_code,
              checkDescription: check.check_types?.check_description,
              category,
              expiryDate: format(expiryDate, 'yyyy-MM-dd'),
              daysOverdue: Math.abs(daysUntilExpiry),
            });
          }
        } else if (daysUntilExpiry <= timeframe) {
          stats.expiring++;
          byCategory[category].expiring++;
          byPilot[pilotId].expiring++;

          if (includeDetails) {
            expiringList.push({
              id: check.id,
              pilotName,
              employeeId: check.pilots?.employee_id,
              checkCode: check.check_types?.check_code,
              checkDescription: check.check_types?.check_description,
              category,
              expiryDate: format(expiryDate, 'yyyy-MM-dd'),
              daysUntilExpiry,
            });
          }
        } else {
          stats.current++;
          byCategory[category].current++;
          byPilot[pilotId].current++;
        }
      }

      byCategory[category].total++;
      byPilot[pilotId].total++;
    });

    // Calculate compliance rate
    const validChecks = stats.total - stats.noDate;
    const compliantChecks = stats.current + stats.expiring;
    const complianceRate = validChecks > 0 ? ((compliantChecks / validChecks) * 100).toFixed(1) : '0.0';

    // Prepare response based on groupBy parameter
    let groupedData: any = {};

    switch (groupBy) {
      case 'category':
        groupedData = Object.entries(byCategory).map(([category, data]) => ({
          category,
          ...data,
          complianceRate: data.total > 0 ? (((data.current + data.expiring) / data.total) * 100).toFixed(1) : '0.0',
        }));
        break;

      case 'pilot':
        groupedData = Object.values(byPilot).map((pilot: any) => ({
          ...pilot,
          complianceRate: pilot.total > 0 ? (((pilot.current + pilot.expiring) / pilot.total) * 100).toFixed(1) : '0.0',
        }));
        break;

      case 'status':
      default:
        groupedData = {
          current: stats.current,
          expiring: stats.expiring,
          expired: stats.expired,
          noDate: stats.noDate,
        };
        break;
    }

    const response: any = {
      success: true,
      data: {
        summary: {
          ...stats,
          complianceRate: parseFloat(complianceRate),
          timeframeDays: timeframe,
        },
        grouped: groupedData,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        timeframe,
        groupBy,
      },
    };

    if (includeDetails) {
      response.data.details = {
        expiring: expiringList.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
        expired: expiredList.sort((a, b) => b.daysOverdue - a.daysOverdue),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Fleet certifications API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
