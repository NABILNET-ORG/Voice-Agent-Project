import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/bookings/[id]/reschedule
 * Reschedule a booking to a new date/time
 */
export async function POST(
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

    // Validate required fields
    if (!body.new_date || !body.new_time) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['new_date', 'new_time']
        },
        { status: 400 }
      );
    }

    // Get the existing booking
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch booking', details: fetchError.message },
        { status: 500 }
      );
    }

    // Check if booking can be rescheduled
    if (existingBooking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot reschedule a completed booking' },
        { status: 400 }
      );
    }

    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot reschedule a cancelled booking' },
        { status: 400 }
      );
    }

    // Check if new slot is available
    const { data: conflictBooking } = await supabase
      .from('bookings')
      .select('id, customer_name, service_or_item')
      .eq('user_id', user.id)
      .eq('date', body.new_date)
      .eq('time', body.new_time)
      .neq('id', params.id)
      .single();

    if (conflictBooking) {
      return NextResponse.json(
        {
          error: 'Time slot not available',
          message: `This time slot is already booked by ${conflictBooking.customer_name} for ${conflictBooking.service_or_item}`,
          suggestion: 'Please choose a different time'
        },
        { status: 409 }
      );
    }

    // Store old values for the response
    const oldDate = existingBooking.date;
    const oldTime = existingBooking.time;

    // Update the booking
    const updateData: Record<string, any> = {
      date: body.new_date,
      time: body.new_time,
      updated_at: new Date().toISOString()
    };

    // Update duration if provided
    if (body.duration_minutes) {
      updateData.duration_minutes = body.duration_minutes;
    }

    // Add reschedule reason if provided
    if (body.reason) {
      updateData.notes = existingBooking.notes
        ? `${existingBooking.notes}\n\nRescheduled: ${body.reason}`
        : `Rescheduled: ${body.reason}`;
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error rescheduling booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to reschedule booking', details: updateError.message },
        { status: 500 }
      );
    }

    // TODO: Update Google Calendar event if integration is active
    // if (updatedBooking.google_calendar_event_id) {
    //   await updateGoogleCalendarEvent(
    //     updatedBooking.google_calendar_event_id,
    //     { date: body.new_date, time: body.new_time }
    //   );
    // }

    // TODO: Send notification to customer about reschedule
    // if (body.notify_customer !== false) {
    //   await sendRescheduleNotification(updatedBooking);
    // }

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: updatedBooking,
      changes: {
        old: {
          date: oldDate,
          time: oldTime
        },
        new: {
          date: body.new_date,
          time: body.new_time
        }
      }
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/bookings/[id]/reschedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
