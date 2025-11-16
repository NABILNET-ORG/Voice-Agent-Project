import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar/client';

/**
 * GET /api/bookings/[id]
 * Get a single booking by ID
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
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching booking:', error);
      return NextResponse.json(
        { error: 'Failed to fetch booking', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/bookings/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update a booking
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
      'customer_email',
      'customer_phone',
      'customer_address',
      'delivery_instructions',
      'booking_type',
      'service_or_item',
      'category',
      'quantity',
      'items',
      'date',
      'time',
      'duration_minutes',
      'estimated_completion',
      'delivery_time_estimate',
      'base_price',
      'delivery_fee',
      'service_fee',
      'tax_amount',
      'discount_amount',
      'total_amount',
      'status',
      'priority',
      'notes',
      'special_instructions',
      'assigned_to',
      'cancellation_reason'
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

    // If date or time is being updated, check for conflicts
    if (updateData.date || updateData.time) {
      const checkDate = updateData.date || body.current_date;
      const checkTime = updateData.time || body.current_time;

      const { data: conflictBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', checkDate)
        .eq('time', checkTime)
        .neq('id', params.id)
        .single();

      if (conflictBooking) {
        return NextResponse.json(
          {
            error: 'Time slot conflict',
            message: 'This time slot is already booked'
          },
          { status: 409 }
        );
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // If status is changing to cancelled, add cancelled_at
    if (updateData.status === 'cancelled' && !updateData.cancelled_at) {
      updateData.cancelled_at = new Date().toISOString();
    }

    // If status is changing to completed, add completed_at
    if (updateData.status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      console.error('Error updating booking:', error);
      return NextResponse.json(
        { error: 'Failed to update booking', details: error.message },
        { status: 500 }
      );
    }

    // Sync to Google Calendar if date/time/duration changed and has calendar event
    if ((updateData.date || updateData.time || updateData.duration_minutes) && data.google_calendar_event_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("google_calendar_access_token, google_calendar_refresh_token")
        .eq("id", user.id)
        .single();

      const { data: config } = await supabase
        .from("business_config")
        .select("google_calendar_id, timezone, calendar_event_title_template")
        .eq("user_id", user.id)
        .single();

      if (profile?.google_calendar_access_token) {
        try {
          // Calculate start and end times
          const startDateTime = `${data.date}T${data.time}:00`;
          const startTime = new Date(startDateTime);
          const endTime = new Date(startTime.getTime() + data.duration_minutes * 60000);

          // Format event title using template or default
          const eventTitle = config?.calendar_event_title_template
            ?.replace('{service}', data.service_or_item)
            ?.replace('{customer_name}', data.customer_name)
            || `${data.service_or_item} - ${data.customer_name}`;

          await updateCalendarEvent(
            profile.google_calendar_access_token,
            profile.google_calendar_refresh_token,
            config?.google_calendar_id || 'primary',
            data.google_calendar_event_id,
            {
              summary: eventTitle,
              description: `Booking ID: ${data.id}${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
              start: {
                dateTime: startDateTime,
                timeZone: config?.timezone || 'UTC'
              },
              end: {
                dateTime: endTime.toISOString().split('.')[0],
                timeZone: config?.timezone || 'UTC'
              }
            }
          );
          console.log('[Update Booking] Calendar event updated:', data.google_calendar_event_id);
        } catch (calendarError) {
          console.error('[Update Booking] Calendar sync failed:', calendarError);
          // Continue with booking update even if calendar sync fails
        }
      }
    }

    // Send update notifications if status changed or date/time changed
    const shouldNotify = updateData.status === 'cancelled' || updateData.date || updateData.time;
    if (shouldNotify) {
      try {
        const baseUrl = request.url.split('/api')[0];
        const notificationType = updateData.status === 'cancelled' ? 'cancellation' : 'update';

        const notificationResponse = await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            booking_id: data.id,
            channel: 'both',
            type: notificationType
          })
        });

        if (notificationResponse.ok) {
          const notificationResult = await notificationResponse.json();
          console.log('[Update Booking] Notifications sent:', notificationResult);
        }
      } catch (notificationError) {
        console.error('[Update Booking] Notification failed:', notificationError);
        // Don't fail update if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      data
    });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/bookings/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/[id]
 * Delete a booking
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

    // First, get the booking to check if it exists and get its details
    const { data: booking, error: fetchError } = await supabase
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

    // Delete from Google Calendar if it exists
    if (booking.google_calendar_event_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("google_calendar_access_token, google_calendar_refresh_token")
        .eq("id", user.id)
        .single();

      const { data: config } = await supabase
        .from("business_config")
        .select("google_calendar_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.google_calendar_access_token) {
        try {
          await deleteCalendarEvent(
            profile.google_calendar_access_token,
            profile.google_calendar_refresh_token,
            config?.google_calendar_id || 'primary',
            booking.google_calendar_event_id
          );
          console.log('[Delete Booking] Calendar event deleted:', booking.google_calendar_event_id);
        } catch (calendarError) {
          console.error('[Delete Booking] Calendar deletion failed:', calendarError);
          // Continue with booking deletion even if calendar fails
        }
      }
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json(
        { error: 'Failed to delete booking', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
      deleted: {
        id: booking.id,
        customer_name: booking.customer_name,
        service: booking.service_or_item,
        date: booking.date,
        time: booking.time
      }
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/bookings/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
