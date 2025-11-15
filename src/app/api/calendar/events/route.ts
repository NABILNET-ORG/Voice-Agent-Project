import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarEvent, listCalendarEvents } from '@/lib/google-calendar/client';

/**
 * POST /api/calendar/events
 * Create a new Google Calendar event
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

    // Get user's Google Calendar tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_access_token, google_calendar_refresh_token')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_calendar_access_token) {
      return NextResponse.json(
        {
          error: 'Google Calendar not connected',
          message: 'Please connect your Google Calendar in Settings > Integrations'
        },
        { status: 400 }
      );
    }

    // Get business config for calendar ID
    const { data: config } = await supabase
      .from('business_config')
      .select('google_calendar_id')
      .eq('user_id', user.id)
      .single();

    const body = await request.json();

    // Create calendar event
    const event = await createCalendarEvent(
      profile.google_calendar_access_token,
      profile.google_calendar_refresh_token,
      config?.google_calendar_id || 'primary',
      {
        summary: body.summary,
        description: body.description,
        location: body.location,
        start: {
          dateTime: body.start_time,
          timeZone: body.timezone || 'UTC',
        },
        end: {
          dateTime: body.end_time,
          timeZone: body.timezone || 'UTC',
        },
        attendees: body.attendees,
        reminders: body.reminders || {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      }
    );

    return NextResponse.json({
      message: 'Calendar event created successfully',
      data: {
        event_id: event.id,
        event_link: event.htmlLink,
        summary: event.summary,
        start: event.start,
        end: event.end,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/events
 * List calendar events
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

    // Get user's Google Calendar tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_access_token, google_calendar_refresh_token')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_calendar_access_token) {
      return NextResponse.json(
        {
          error: 'Google Calendar not connected',
          message: 'Please connect your Google Calendar in Settings > Integrations'
        },
        { status: 400 }
      );
    }

    // Get business config
    const { data: config } = await supabase
      .from('business_config')
      .select('google_calendar_id')
      .eq('user_id', user.id)
      .single();

    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get('time_min');
    const timeMax = searchParams.get('time_max');
    const maxResults = parseInt(searchParams.get('max_results') || '250');

    // List events
    const events = await listCalendarEvents(
      profile.google_calendar_access_token,
      profile.google_calendar_refresh_token,
      config?.google_calendar_id || 'primary',
      {
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        maxResults,
      }
    );

    return NextResponse.json({
      data: events,
      count: events.length
    });

  } catch (error: any) {
    console.error('Error listing calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to list calendar events', details: error.message },
      { status: 500 }
    );
  }
}
