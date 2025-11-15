import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar/client';

/**
 * PATCH /api/calendar/events/[id]
 * Update a calendar event
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

    // Get user's Google Calendar tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_access_token, google_calendar_refresh_token')
      .eq('id', user.id)
      .single();

    if (!profile?.google_calendar_access_token) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    // Get business config
    const { data: config } = await supabase
      .from('business_config')
      .select('google_calendar_id')
      .eq('user_id', user.id)
      .single();

    const body = await request.json();

    // Build update object
    const eventUpdate: any = {};
    if (body.summary) eventUpdate.summary = body.summary;
    if (body.description) eventUpdate.description = body.description;
    if (body.location) eventUpdate.location = body.location;
    if (body.start_time) {
      eventUpdate.start = {
        dateTime: body.start_time,
        timeZone: body.timezone || 'UTC',
      };
    }
    if (body.end_time) {
      eventUpdate.end = {
        dateTime: body.end_time,
        timeZone: body.timezone || 'UTC',
      };
    }
    if (body.attendees) eventUpdate.attendees = body.attendees;
    if (body.reminders) eventUpdate.reminders = body.reminders;

    // Update calendar event
    const event = await updateCalendarEvent(
      profile.google_calendar_access_token,
      profile.google_calendar_refresh_token,
      config?.google_calendar_id || 'primary',
      params.id,
      eventUpdate
    );

    return NextResponse.json({
      message: 'Calendar event updated successfully',
      data: {
        event_id: event.id,
        event_link: event.htmlLink,
        summary: event.summary,
        start: event.start,
        end: event.end,
      }
    });

  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/events/[id]
 * Delete a calendar event
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

    // Get user's Google Calendar tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_access_token, google_calendar_refresh_token')
      .eq('id', user.id)
      .single();

    if (!profile?.google_calendar_access_token) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    // Get business config
    const { data: config } = await supabase
      .from('business_config')
      .select('google_calendar_id')
      .eq('user_id', user.id)
      .single();

    // Delete calendar event
    await deleteCalendarEvent(
      profile.google_calendar_access_token,
      profile.google_calendar_refresh_token,
      config?.google_calendar_id || 'primary',
      params.id
    );

    return NextResponse.json({
      message: 'Calendar event deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event', details: error.message },
      { status: 500 }
    );
  }
}
