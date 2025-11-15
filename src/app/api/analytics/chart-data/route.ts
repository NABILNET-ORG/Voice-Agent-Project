import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/chart-data
 * Get time-series data for charts
 * Query params: ?type=bookings|revenue|calls&period=week|month|year&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
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
    const type = searchParams.get('type') || 'bookings';
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
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7);
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
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = {
            start: monthStart,
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          };
      }
    }

    let chartData: any = {};

    switch (type) {
      case 'bookings':
        chartData = await getBookingsChartData(supabase, user.id, dateFilter, period);
        break;
      case 'revenue':
        chartData = await getRevenueChartData(supabase, user.id, dateFilter, period);
        break;
      case 'calls':
        chartData = await getCallsChartData(supabase, user.id, dateFilter, period);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid chart type. Use: bookings, revenue, or calls' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      data: chartData,
      period: {
        start: dateFilter.start.toISOString(),
        end: dateFilter.end.toISOString(),
        type: period
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/analytics/chart-data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getBookingsChartData(
  supabase: any,
  userId: string,
  dateFilter: { start: Date; end: Date },
  period: string
) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .gte('date', dateFilter.start.toISOString().split('T')[0])
    .lte('date', dateFilter.end.toISOString().split('T')[0]);

  if (error) {
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }

  // Group by time period
  const timeSeriesData = groupByPeriod(
    bookings || [],
    dateFilter,
    period,
    (booking) => booking.date,
    (items) => items.length
  );

  // Service popularity
  const serviceCount: Record<string, number> = {};
  bookings?.forEach(booking => {
    const service = booking.service_or_item || 'Unknown';
    serviceCount[service] = (serviceCount[service] || 0) + 1;
  });

  const serviceData = Object.entries(serviceCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Status distribution
  const statusCount = {
    pending: bookings?.filter(b => b.status === 'pending').length || 0,
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    completed: bookings?.filter(b => b.status === 'completed').length || 0,
    cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
  };

  const statusData = Object.entries(statusCount)
    .map(([name, value]) => ({ name, value }));

  return {
    timeSeries: timeSeriesData,
    services: serviceData,
    status: statusData
  };
}

async function getRevenueChartData(
  supabase: any,
  userId: string,
  dateFilter: { start: Date; end: Date },
  period: string
) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('date', dateFilter.start.toISOString().split('T')[0])
    .lte('date', dateFilter.end.toISOString().split('T')[0]);

  if (error) {
    throw new Error(`Failed to fetch revenue data: ${error.message}`);
  }

  // Group by time period
  const timeSeriesData = groupByPeriod(
    bookings || [],
    dateFilter,
    period,
    (booking) => booking.date,
    (items) => items.reduce((sum, b) => sum + (parseFloat(b.total_amount || '0') || 0), 0)
  );

  // Revenue by service
  const serviceRevenue: Record<string, number> = {};
  bookings?.forEach(booking => {
    const service = booking.service_or_item || 'Unknown';
    const amount = parseFloat(booking.total_amount || '0') || 0;
    serviceRevenue[service] = (serviceRevenue[service] || 0) + amount;
  });

  const serviceData = Object.entries(serviceRevenue)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // Revenue breakdown
  const breakdown = {
    base: bookings?.reduce((sum, b) => sum + (parseFloat(b.base_price || '0') || 0), 0) || 0,
    deliveryFees: bookings?.reduce((sum, b) => sum + (parseFloat(b.delivery_fee || '0') || 0), 0) || 0,
    serviceFees: bookings?.reduce((sum, b) => sum + (parseFloat(b.service_fee || '0') || 0), 0) || 0,
    taxes: bookings?.reduce((sum, b) => sum + (parseFloat(b.tax_amount || '0') || 0), 0) || 0,
  };

  const breakdownData = Object.entries(breakdown)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  return {
    timeSeries: timeSeriesData,
    services: serviceData,
    breakdown: breakdownData
  };
}

async function getCallsChartData(
  supabase: any,
  userId: string,
  dateFilter: { start: Date; end: Date },
  period: string
) {
  const { data: calls, error } = await supabase
    .from('call_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', dateFilter.start.toISOString())
    .lte('started_at', dateFilter.end.toISOString());

  if (error) {
    throw new Error(`Failed to fetch calls data: ${error.message}`);
  }

  // Group by time period
  const timeSeriesData = groupByPeriod(
    calls || [],
    dateFilter,
    period,
    (call) => call.started_at.split('T')[0],
    (items) => items.length
  );

  // Outcome distribution
  const outcomeCount = {
    success: calls?.filter(c => c.outcome === 'success').length || 0,
    failed: calls?.filter(c => c.outcome === 'failed').length || 0,
    no_answer: calls?.filter(c => c.outcome === 'no_answer').length || 0,
    busy: calls?.filter(c => c.outcome === 'busy').length || 0,
  };

  const outcomeData = Object.entries(outcomeCount)
    .map(([name, value]) => ({ name, value }));

  // Call duration distribution
  const durationRanges = {
    '0-1 min': calls?.filter(c => c.duration_seconds > 0 && c.duration_seconds <= 60).length || 0,
    '1-3 min': calls?.filter(c => c.duration_seconds > 60 && c.duration_seconds <= 180).length || 0,
    '3-5 min': calls?.filter(c => c.duration_seconds > 180 && c.duration_seconds <= 300).length || 0,
    '5+ min': calls?.filter(c => c.duration_seconds > 300).length || 0,
  };

  const durationData = Object.entries(durationRanges)
    .map(([name, value]) => ({ name, value }));

  // Hourly distribution
  const hourCounts: Record<number, number> = {};
  calls?.forEach(call => {
    const hour = new Date(call.started_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    value: hourCounts[hour] || 0
  }));

  return {
    timeSeries: timeSeriesData,
    outcomes: outcomeData,
    durations: durationData,
    hourly: hourlyData
  };
}

function groupByPeriod<T>(
  items: T[],
  dateFilter: { start: Date; end: Date },
  period: string,
  dateExtractor: (item: T) => string,
  valueCalculator: (items: T[]) => number
): Array<{ date: string; value: number }> {
  const grouped: Record<string, T[]> = {};

  // Initialize all dates/periods with 0
  const current = new Date(dateFilter.start);
  while (current <= dateFilter.end) {
    const key = formatDateKey(current, period);
    grouped[key] = [];

    if (period === 'year') {
      current.setMonth(current.getMonth() + 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
  }

  // Group items by period
  items.forEach(item => {
    const date = new Date(dateExtractor(item));
    const key = formatDateKey(date, period);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  // Calculate values
  return Object.entries(grouped)
    .map(([date, items]) => ({
      date,
      value: valueCalculator(items)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatDateKey(date: Date, period: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (period === 'year') {
    return `${year}-${month}`;
  }
  return `${year}-${month}-${day}`;
}
