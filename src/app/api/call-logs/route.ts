import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/call-logs
 * List all call logs for the authenticated user
 * Query params: ?outcome=success&limit=50&offset=0
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const outcome = searchParams.get('outcome');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const searchTerm = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query
    let query = supabase
      .from('call_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    // Apply filters
    if (outcome) {
      query = query.eq('outcome', outcome);
    }

    if (searchTerm) {
      query = query.or(`customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`);
    }

    if (startDate) {
      query = query.gte('started_at', startDate);
    }

    if (endDate) {
      query = query.lte('started_at', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching call logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch call logs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/call-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/call-logs
 * Create a new call log
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['customer_phone'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
        { status: 400 }
      );
    }

    // Prepare call log data
    const callLogData = {
      user_id: user.id,
      call_sid: body.call_sid || null,
      customer_phone: body.customer_phone,
      customer_name: body.customer_name || null,
      started_at: body.started_at || new Date().toISOString(),
      ended_at: body.ended_at || null,
      duration_seconds: body.duration_seconds || null,
      outcome: body.outcome || 'in_progress',
      booking_type: body.booking_type || null,
      transcript: body.transcript || null,
      sentiment: body.sentiment || null,
      booking_id: body.booking_id || null,
      recording_url: body.recording_url || null,
      recording_duration: body.recording_duration || null,
    };

    const { data, error } = await supabase
      .from('call_logs')
      .insert([callLogData])
      .select()
      .single();

    if (error) {
      console.error('Error creating call log:', error);
      return NextResponse.json(
        { error: 'Failed to create call log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Call log created successfully',
      data
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/call-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
