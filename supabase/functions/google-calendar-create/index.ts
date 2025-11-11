import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { userId, bookingId, summary, description, startDateTime, endDateTime } = await req.json();

    console.log('Calendar create request:', { userId, bookingId, summary, startDateTime });

    if (!userId || !bookingId) {
      throw new Error('Missing required fields: userId, bookingId');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's business config
    const { data: config, error: configError } = await supabase
      .from('business_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !config) {
      console.error('Business config not found:', configError);
      throw new Error('Business config not found');
    }

    // Check if calendar sync is enabled
    if (!config.google_calendar_sync_enabled) {
      console.log('Calendar sync not enabled for user');
      return new Response(
        JSON.stringify({ success: true, message: 'Calendar sync disabled', eventId: null }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Fetch user's profile for calendar tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_access_token, google_calendar_refresh_token')
      .eq('id', userId)
      .single();

    if (profileError || !profile || !profile.google_calendar_access_token) {
      console.log('No calendar token found - skipping calendar creation');
      return new Response(
        JSON.stringify({ success: true, message: 'Calendar not connected', eventId: null }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Create Google Calendar event
    const calendarId = config.google_calendar_id || 'primary';
    const eventData = {
      summary: summary || 'Booking',
      description: description || '',
      start: {
        dateTime: startDateTime,
        timeZone: config.timezone || 'UTC',
      },
      end: {
        dateTime: endDateTime,
        timeZone: config.timezone || 'UTC',
      },
      reminders: config.set_event_reminder
        ? {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: config.event_reminder_minutes || 60 }],
          }
        : undefined,
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.google_calendar_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Calendar API Error:', error);
      // Don't fail the booking if calendar creation fails
      return new Response(
        JSON.stringify({ success: false, message: 'Calendar event creation failed', eventId: null }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const event = await response.json();
    console.log('Calendar event created:', event.id);

    // Update booking with calendar event ID
    await supabase
      .from('bookings')
      .update({ google_calendar_event_id: event.id })
      .eq('id', bookingId);

    return new Response(
      JSON.stringify({ success: true, eventId: event.id }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
