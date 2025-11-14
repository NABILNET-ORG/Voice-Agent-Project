import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  try {
    const { service, preferredDate, preferredTime, userId } = await req.json();

    console.log('Calendar check request:', { service, preferredDate, preferredTime, userId });

    if (!userId) {
      throw new Error('Missing userId');
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

    // Fetch user's profile for calendar tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
    }

    // Parse business hours and service duration
    const businessHours = config.business_hours as Record<string, { open: string; close: string }>;
    const services = config.services as Array<{ name: string; duration: number; bufferTime?: number }>;
    const requestedService = services.find(s => s.name.toLowerCase() === service.toLowerCase());
    const serviceDuration = requestedService?.duration || 60;
    const bufferTime = config.booking_buffer_minutes || requestedService?.bufferTime || 15;

    // Determine date range to check
    const today = new Date();
    const checkDate = preferredDate ? new Date(preferredDate) : today;
    const dayOfWeek = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Get business hours for the day
    const hoursForDay = businessHours[dayOfWeek];
    if (!hoursForDay || !hoursForDay.open) {
      return new Response(
        JSON.stringify({
          available: [],
          message: `We're closed on ${dayOfWeek}s. Would you like to book for another day?`,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Fetch existing bookings from database
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('date, time, duration_minutes')
      .eq('user_id', userId)
      .eq('date', checkDate.toISOString().split('T')[0])
      .neq('status', 'cancelled');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    // Generate available time slots
    const availableSlots: string[] = [];
    const openTime = hoursForDay.open; // e.g., "09:00"
    const closeTime = hoursForDay.close; // e.g., "18:00"

    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Check if this slot conflicts with existing bookings
      const hasConflict = existingBookings?.some(booking => {
        const bookingTime = booking.time;
        const bookingDuration = booking.duration_minutes || serviceDuration;
        // Simple time conflict check (can be improved)
        return bookingTime === timeSlot;
      });

      if (!hasConflict) {
        availableSlots.push(timeSlot);
      }

      // Increment by service duration + buffer
      currentMinute += serviceDuration + bufferTime;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    // Return first 5 available slots
    const topSlots = availableSlots.slice(0, 5);

    return new Response(
      JSON.stringify({
        available: topSlots,
        date: checkDate.toISOString().split('T')[0],
        message: topSlots.length > 0
          ? `I have availability at: ${topSlots.join(', ')}. Which time works best for you?`
          : `I'm sorry, we're fully booked on ${checkDate.toLocaleDateString()}. Would you like to try another day?`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error checking calendar:', error);
    return new Response(
      JSON.stringify({ error: error.message, available: [] }),
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
