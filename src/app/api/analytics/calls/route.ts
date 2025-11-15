import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/calls
 * Get call statistics
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

    // Fetch all calls for the user
    const { data: allCalls, error: allError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('user_id', user.id);

    if (allError) {
      console.error('Error fetching all calls:', allError);
      return NextResponse.json(
        { error: 'Failed to fetch calls', details: allError.message },
        { status: 500 }
      );
    }

    // Fetch calls in the specified period
    const { data: periodCalls, error: periodError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', dateFilter.start.toISOString())
      .lte('started_at', dateFilter.end.toISOString());

    if (periodError) {
      console.error('Error fetching period calls:', periodError);
      return NextResponse.json(
        { error: 'Failed to fetch calls', details: periodError.message },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalCalls = allCalls?.length || 0;
    const periodTotal = periodCalls?.length || 0;

    // Outcome breakdown
    const outcomeBreakdown = {
      success: periodCalls?.filter(c => c.outcome === 'success').length || 0,
      failed: periodCalls?.filter(c => c.outcome === 'failed').length || 0,
      no_answer: periodCalls?.filter(c => c.outcome === 'no_answer').length || 0,
      busy: periodCalls?.filter(c => c.outcome === 'busy').length || 0,
      in_progress: periodCalls?.filter(c => c.outcome === 'in_progress').length || 0,
    };

    // Success rate
    const successfulCalls = outcomeBreakdown.success;
    const successRate = periodTotal > 0
      ? (successfulCalls / periodTotal) * 100
      : 0;

    // Average call duration
    const callsWithDuration = periodCalls?.filter(c => c.duration_seconds > 0) || [];
    const totalDuration = callsWithDuration.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
    const averageDuration = callsWithDuration.length > 0
      ? totalDuration / callsWithDuration.length
      : 0;

    // Calls that resulted in bookings
    const callsWithBookings = periodCalls?.filter(c => c.booking_id !== null).length || 0;
    const conversionRate = periodTotal > 0
      ? (callsWithBookings / periodTotal) * 100
      : 0;

    // Sentiment analysis
    const sentimentBreakdown = {
      positive: periodCalls?.filter(c => c.sentiment === 'positive').length || 0,
      neutral: periodCalls?.filter(c => c.sentiment === 'neutral').length || 0,
      negative: periodCalls?.filter(c => c.sentiment === 'negative').length || 0,
    };

    // Today's calls
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const todayCalls = allCalls?.filter(c =>
      new Date(c.started_at) >= today
    ).length || 0;

    // This week's calls
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString();

    const weekCalls = allCalls?.filter(c =>
      new Date(c.started_at) >= weekStart
    ).length || 0;

    // This month's calls
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString();

    const monthCalls = allCalls?.filter(c =>
      new Date(c.started_at) >= monthStart
    ).length || 0;

    // Calculate growth rate (compared to previous period)
    const periodDays = Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(dateFilter.start);
    previousStart.setDate(previousStart.getDate() - periodDays);

    const { data: previousCalls } = await supabase
      .from('call_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('started_at', previousStart.toISOString())
      .lt('started_at', dateFilter.start.toISOString());

    const previousTotal = previousCalls?.length || 0;
    const growthRate = previousTotal > 0
      ? ((periodTotal - previousTotal) / previousTotal) * 100
      : periodTotal > 0 ? 100 : 0;

    // Peak call hours
    const hourCounts: Record<number, number> = {};
    periodCalls?.forEach(call => {
      const hour = new Date(call.started_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return NextResponse.json({
      data: {
        total: totalCalls,
        period: {
          total: periodTotal,
          range: {
            start: dateFilter.start.toISOString(),
            end: dateFilter.end.toISOString()
          }
        },
        today: todayCalls,
        thisWeek: weekCalls,
        thisMonth: monthCalls,
        successRate: Math.round(successRate * 10) / 10,
        averageDuration: Math.round(averageDuration),
        conversionRate: Math.round(conversionRate * 10) / 10,
        outcomeBreakdown,
        sentimentBreakdown,
        callsWithBookings,
        growthRate: Math.round(growthRate * 10) / 10,
        peakHours
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/analytics/calls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
