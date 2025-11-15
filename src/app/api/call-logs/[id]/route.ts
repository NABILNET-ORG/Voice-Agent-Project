import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/call-logs/[id]
 * Get a single call log by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Call log not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching call log:', error);
      return NextResponse.json(
        { error: 'Failed to fetch call log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Unexpected error in GET /api/call-logs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/call-logs/[id]
 * Update a call log
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fields that can be updated
    const allowedFields = [
      'customer_name',
      'customer_phone',
      'ended_at',
      'duration_seconds',
      'outcome',
      'booking_type',
      'transcript',
      'sentiment',
      'booking_id',
      'recording_url',
      'recording_duration'
    ];

    // Filter out fields that aren't allowed to be updated
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('call_logs')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Call log not found' },
          { status: 404 }
        );
      }
      console.error('Error updating call log:', error);
      return NextResponse.json(
        { error: 'Failed to update call log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Call log updated successfully',
      data
    });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/call-logs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/call-logs/[id]
 * Delete a call log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { error } = await supabase
      .from('call_logs')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting call log:', error);
      return NextResponse.json(
        { error: 'Failed to delete call log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Call log deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/call-logs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
