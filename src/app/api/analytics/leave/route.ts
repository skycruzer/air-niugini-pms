import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.debug('📅 API /analytics/leave: Getting leave analytics...');

    const supabaseAdmin = getSupabaseAdmin();

    const { data: leaveRequests, error } = await supabaseAdmin.from('leave_requests').select(`
        id,
        pilot_id,
        request_type,
        status,
        start_date,
        end_date,
        created_at,
        reviewed_at,
        pilots (
          first_name,
          last_name
        )
      `);

    if (error) throw error;

    const requests = leaveRequests || [];
    const today = new Date();
    const thisMonth = startOfMonth(today);
    const lastMonth = startOfMonth(subMonths(today, 1));

    // Basic counts
    const totalRequests = requests.length;
    const pending = requests.filter((r: any) => r.status === 'PENDING').length;
    const approved = requests.filter((r: any) => r.status === 'APPROVED').length;
    const denied = requests.filter((r: any) => r.status === 'DENIED').length;

    // Monthly counts
    const thisMonthRequests = requests.filter(
      (r: any) => new Date(r.created_at) >= thisMonth
    ).length;

    const lastMonthRequests = requests.filter((r: any) => {
      const createdAt = new Date(r.created_at);
      return createdAt >= lastMonth && createdAt < thisMonth;
    }).length;

    // Type breakdown
    const typeBreakdown = {
      RDO: requests.filter((r: any) => r.request_type === 'RDO').length,
      SDO: requests.filter((r: any) => r.request_type === 'SDO').length,
      ANNUAL: requests.filter((r: any) => r.request_type === 'ANNUAL').length,
      SICK: requests.filter((r: any) => r.request_type === 'SICK').length,
      LSL: requests.filter((r: any) => r.request_type === 'LSL').length,
      LWOP: requests.filter((r: any) => r.request_type === 'LWOP').length,
      MATERNITY: requests.filter((r: any) => r.request_type === 'MATERNITY').length,
      COMPASSIONATE: requests.filter((r: any) => r.request_type === 'COMPASSIONATE').length,
    };

    // Monthly trends (last 12 months)
    const monthlyRequests = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(monthStart);
      const monthName = format(monthStart, 'MMM yyyy');

      const monthRequests = requests.filter((r: any) => {
        const createdAt = new Date(r.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });

      monthlyRequests.push({
        month: monthName,
        total: monthRequests.length,
        approved: monthRequests.filter((r: any) => r.status === 'APPROVED').length,
        denied: monthRequests.filter((r: any) => r.status === 'DENIED').length,
      });
    }

    // Seasonal patterns (quarters)
    const seasonalPattern = [
      {
        quarter: 'Q1',
        averageRequests: Math.round(
          monthlyRequests.slice(0, 3).reduce((sum, m) => sum + m.total, 0) / 3
        ),
      },
      {
        quarter: 'Q2',
        averageRequests: Math.round(
          monthlyRequests.slice(3, 6).reduce((sum, m) => sum + m.total, 0) / 3
        ),
      },
      {
        quarter: 'Q3',
        averageRequests: Math.round(
          monthlyRequests.slice(6, 9).reduce((sum, m) => sum + m.total, 0) / 3
        ),
      },
      {
        quarter: 'Q4',
        averageRequests: Math.round(
          monthlyRequests.slice(9, 12).reduce((sum, m) => sum + m.total, 0) / 3
        ),
      },
    ];

    const result = {
      totalRequests,
      pending,
      approved,
      denied,
      thisMonth: thisMonthRequests,
      lastMonth: lastMonthRequests,
      trends: {
        monthlyRequests,
        seasonalPattern,
      },
      typeBreakdown,
    };

    logger.info(' API /analytics/leave: Successfully retrieved leave analytics');
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(' API /analytics/leave: Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get leave analytics' },
      { status: 500 }
    );
  }
}
