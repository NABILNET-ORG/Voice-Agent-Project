import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/revenue
 * Get revenue statistics
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

    // Fetch completed bookings with revenue data
    const { data: completedBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('date', dateFilter.start.toISOString().split('T')[0])
      .lte('date', dateFilter.end.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching bookings for revenue:', error);
      return NextResponse.json(
        { error: 'Failed to fetch revenue data', details: error.message },
        { status: 500 }
      );
    }

    // Calculate revenue metrics
    const bookings = completedBookings || [];

    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.total_amount || '0') || 0);
    }, 0);

    const averageBookingValue = bookings.length > 0
      ? totalRevenue / bookings.length
      : 0;

    // Revenue by service
    const revenueByService: Record<string, number> = {};
    bookings.forEach(booking => {
      const service = booking.service_or_item || 'Unknown';
      const amount = parseFloat(booking.total_amount || '0') || 0;
      revenueByService[service] = (revenueByService[service] || 0) + amount;
    });

    const topServices = Object.entries(revenueByService)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Revenue breakdown
    const baseRevenue = bookings.reduce((sum, b) =>
      sum + (parseFloat(b.base_price || '0') || 0), 0);
    const deliveryFees = bookings.reduce((sum, b) =>
      sum + (parseFloat(b.delivery_fee || '0') || 0), 0);
    const serviceFees = bookings.reduce((sum, b) =>
      sum + (parseFloat(b.service_fee || '0') || 0), 0);
    const taxes = bookings.reduce((sum, b) =>
      sum + (parseFloat(b.tax_amount || '0') || 0), 0);
    const discounts = bookings.reduce((sum, b) =>
      sum + (parseFloat(b.discount_amount || '0') || 0), 0);

    // Calculate growth rate (compared to previous period)
    const periodDays = Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(dateFilter.start);
    previousStart.setDate(previousStart.getDate() - periodDays);
    const previousStartStr = previousStart.toISOString().split('T')[0];
    const previousEndStr = dateFilter.start.toISOString().split('T')[0];

    const { data: previousBookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('date', previousStartStr)
      .lt('date', previousEndStr);

    const previousRevenue = (previousBookings || []).reduce((sum, b) =>
      sum + (parseFloat(b.total_amount || '0') || 0), 0);

    const growthRate = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : totalRevenue > 0 ? 100 : 0;

    // Daily revenue trend for the period
    const dailyRevenue: Record<string, number> = {};
    bookings.forEach(booking => {
      const date = booking.date;
      const amount = parseFloat(booking.total_amount || '0') || 0;
      dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;
    });

    const revenueTrend = Object.entries(dailyRevenue)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageBookingValue: Math.round(averageBookingValue * 100) / 100,
        completedBookings: bookings.length,
        growthRate: Math.round(growthRate * 10) / 10,
        breakdown: {
          base: Math.round(baseRevenue * 100) / 100,
          deliveryFees: Math.round(deliveryFees * 100) / 100,
          serviceFees: Math.round(serviceFees * 100) / 100,
          taxes: Math.round(taxes * 100) / 100,
          discounts: Math.round(discounts * 100) / 100,
        },
        topServices,
        trend: revenueTrend,
        period: {
          start: dateFilter.start.toISOString(),
          end: dateFilter.end.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/analytics/revenue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
