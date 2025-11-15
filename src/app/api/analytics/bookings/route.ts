import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/bookings
 * Get booking statistics
 * Query params: ?period=today|week|month|year&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Calculate date ranges based on period
    const now = new Date();
    let dateFilter: { start: Date; end: Date };

    if (startDate && endDate) {
      dateFilter = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    } else {
      switch (period) {
        case 'today':
          dateFilter = {
            start: new Date(now.setHours(0, 0, 0, 0)),
            end: new Date(now.setHours(23, 59, 59, 999))
          };
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          dateFilter = {
            start: weekStart,
            end: new Date()
          };
          break;
        case 'year':
          dateFilter = {
            start: new Date(now.getFullYear(), 0, 1),
            end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
          };
          break;
        case 'month':
        default:
          dateFilter = {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          };
      }
    }

    // Fetch all bookings for the user
    const { data: allBookings, error: allError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id);

    if (allError) {
      console.error('Error fetching all bookings:', allError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: allError.message },
        { status: 500 }
      );
    }

    // Fetch bookings in the specified period
    const { data: periodBookings, error: periodError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', dateFilter.start.toISOString().split('T')[0])
      .lte('date', dateFilter.end.toISOString().split('T')[0]);

    if (periodError) {
      console.error('Error fetching period bookings:', periodError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: periodError.message },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalBookings = allBookings?.length || 0;
    const periodTotal = periodBookings?.length || 0;

    // Status breakdown for period
    const statusBreakdown = {
      pending: periodBookings?.filter(b => b.status === 'pending').length || 0,
      confirmed: periodBookings?.filter(b => b.status === 'confirmed').length || 0,
      completed: periodBookings?.filter(b => b.status === 'completed').length || 0,
      cancelled: periodBookings?.filter(b => b.status === 'cancelled').length || 0,
    };

    // Today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const todayBookings = allBookings?.filter(b => b.date === todayStr).length || 0;

    // This week's bookings
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const weekBookings = allBookings?.filter(b => b.date >= weekStartStr).length || 0;

    // This month's bookings
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const monthBookings = allBookings?.filter(b => b.date >= monthStartStr).length || 0;

    // Calculate growth rate (compared to previous period)
    const periodDays = Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(dateFilter.start);
    previousStart.setDate(previousStart.getDate() - periodDays);
    const previousStartStr = previousStart.toISOString().split('T')[0];
    const previousEndStr = dateFilter.start.toISOString().split('T')[0];

    const { data: previousBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', user.id)
      .gte('date', previousStartStr)
      .lt('date', previousEndStr);

    const previousTotal = previousBookings?.length || 0;
    const growthRate = previousTotal > 0
      ? ((periodTotal - previousTotal) / previousTotal) * 100
      : periodTotal > 0 ? 100 : 0;

    // Service popularity
    const serviceCount: Record<string, number> = {};
    periodBookings?.forEach(booking => {
      const service = booking.service_or_item || 'Unknown';
      serviceCount[service] = (serviceCount[service] || 0) + 1;
    });

    const popularServices = Object.entries(serviceCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      data: {
        total: totalBookings,
        period: {
          total: periodTotal,
          range: {
            start: dateFilter.start.toISOString(),
            end: dateFilter.end.toISOString()
          }
        },
        today: todayBookings,
        thisWeek: weekBookings,
        thisMonth: monthBookings,
        statusBreakdown,
        growthRate: Math.round(growthRate * 10) / 10,
        popularServices
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/analytics/bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
