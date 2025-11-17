import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listCalendarEvents } from '@/lib/google-calendar/client';

/**
 * POST /api/voice-agent/session
 * Handle voice agent function calls (tools) from OpenAI Realtime API
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
    const { function_name, arguments: args, call_id } = body;

    if (!function_name) {
      return NextResponse.json(
        { error: 'Missing function_name' },
        { status: 400 }
      );
    }

    let result;

    console.log('[Voice Agent Session] Executing function:', function_name, 'with args:', args);

    try {
      switch (function_name) {
        case 'check_availability':
          result = await checkAvailability(supabase, user.id, args);
          break;

        case 'create_booking':
          result = await createBooking(supabase, user.id, args, call_id);
          break;

        case 'get_available_services':
          result = await getAvailableServices(supabase, user.id);
          break;

        default:
          return NextResponse.json(
            { error: `Unknown function: ${function_name}` },
            { status: 400 }
          );
      }

      console.log('[Voice Agent Session] Function result:', function_name, result);

      return NextResponse.json({
        call_id,
        result
      });
    } catch (functionError: any) {
      console.error('[Voice Agent Session] Function execution error:', functionError);
      return NextResponse.json({
        call_id,
        result: {
          available: false,
          message: `Error: ${functionError.message || 'Function execution failed'}`
        }
      });
    }

  } catch (error: any) {
    console.error('Unexpected error in POST /api/voice-agent/session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Check if a time slot is available
 */
async function checkAvailability(
  supabase: any,
  userId: string,
  args: { date?: string; time?: string }
): Promise<{ available: boolean; message: string }> {
  console.log('[checkAvailability] Function called with args:', JSON.stringify(args));
  console.log('[checkAvailability] args.date:', args.date);
  console.log('[checkAvailability] args.time:', args.time);

  // Default to today if date not provided or invalid
  let date = args.date;
  if (!date || date === 'undefined' || date === 'null') {
    date = new Date().toISOString().split('T')[0];
    console.log('[checkAvailability] Date defaulted to today:', date);
  }

  // Validate time format
  let time = args.time;
  console.log('[checkAvailability] Time value:', time, 'Type:', typeof time);
  if (!time || time === 'undefined' || time === 'null') {
    return {
      available: false,
      message: 'Please specify a time for the appointment.'
    };
  }

  // Ensure time is in HH:MM format
  if (!time.match(/^\d{1,2}:\d{2}$/)) {
    // Try to parse common formats
    const timeMatch = time.match(/(\d{1,2}):?(\d{2})?/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = (timeMatch[2] || '00').padStart(2, '0');
      time = `${hours}:${minutes}`;
    } else {
      return {
        available: false,
        message: 'Invalid time format. Please use format like 10:30 or 2:00 PM.'
      };
    }
  }

  console.log('[Voice Agent] Checking availability:', { date, time, originalArgs: args });

  // Check if slot is already booked in database
  const { data: existingBooking, error } = await supabase
    .from('bookings')
    .select('id, customer_name, service_or_item')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('time', time)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[Voice Agent] Error checking database availability:', error);
    return {
      available: false,
      message: 'Unable to check availability at this time'
    };
  }

  if (existingBooking) {
    return {
      available: false,
      message: `Sorry, ${time} on ${date} is already booked.`
    };
  }

  // Check Google Calendar if enabled
  const { data: config } = await supabase
    .from('business_config')
    .select('google_calendar_sync_enabled, google_calendar_id')
    .eq('user_id', userId)
    .single();

  if (config?.google_calendar_sync_enabled) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_access_token, google_calendar_refresh_token')
      .eq('id', userId)
      .single();

    if (profile?.google_calendar_access_token) {
      try {
        const startDateTime = `${date}T${time}:00`;
        const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

        const calendarEvents = await listCalendarEvents(
          profile.google_calendar_access_token,
          profile.google_calendar_refresh_token,
          config.google_calendar_id || 'primary',
          {
            timeMin: startDateTime,
            timeMax: endDateTime,
            maxResults: 10
          }
        );

        if (calendarEvents && calendarEvents.length > 0) {
          console.log('[Voice Agent] Calendar conflict found for', time, 'on', date);
          return {
            available: false,
            message: `Sorry, ${time} on ${date} conflicts with an existing calendar event.`
          };
        }

        console.log('[Voice Agent] Calendar checked - slot available:', time, 'on', date);
      } catch (calendarError) {
        console.error('[Voice Agent] Calendar check failed:', calendarError);
        // Continue with database-only check
      }
    }
  }

  return {
    available: true,
    message: `Yes, ${time} on ${date} is available.`
  };
}

/**
 * Create a new booking
 */
async function createBooking(
  supabase: any,
  userId: string,
  args: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    service_name: string;
    date: string;
    time: string;
    notes?: string;
  },
  callId?: string
): Promise<{ success: boolean; message: string; booking_id?: string }> {
  const {
    customer_name,
    customer_email,
    customer_phone,
    service_name,
    date,
    time,
    notes
  } = args;

  // First check availability
  const availability = await checkAvailability(supabase, userId, { date, time });
  if (!availability.available) {
    return {
      success: false,
      message: availability.message
    };
  }

  // Get service details and pricing
  const { data: config } = await supabase
    .from('business_config')
    .select('services, tax_rate, service_fee_enabled')
    .eq('user_id', userId)
    .single();

  let basePrice = 0;
  let duration = 60;

  if (config?.services) {
    const services = Array.isArray(config.services) ? config.services : [];
    const service = services.find((s: any) =>
      s.name === service_name ||
      s.name_en === service_name ||
      (s.name_en && s.name_en.toLowerCase() === service_name.toLowerCase()) ||
      (s.name && s.name.toLowerCase() === service_name.toLowerCase())
    );

    if (service) {
      basePrice = parseFloat(service.price || '0');
      duration = parseInt(service.duration || '60');
    }
  }

  // Calculate pricing
  const subtotal = basePrice;
  const serviceFee = config?.service_fee_enabled ? subtotal * 0.05 : 0;
  const taxAmount = (subtotal + serviceFee) * (config?.tax_rate || 0.15);
  const totalAmount = subtotal + serviceFee + taxAmount;

  // Create the booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      call_log_id: callId || null,
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
      booking_type: 'appointment',
      service_or_item: service_name,
      date,
      time,
      duration_minutes: duration,
      base_price: basePrice,
      service_fee: serviceFee,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes: notes || '',
      status: 'confirmed',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    return {
      success: false,
      message: 'Sorry, I was unable to create the booking. Please try again or contact us directly.'
    };
  }

  return {
    success: true,
    booking_id: booking.id,
    message: `Perfect! I've confirmed your booking for ${service_name} on ${date} at ${time}. The total is $${totalAmount.toFixed(2)}. You'll receive a confirmation email at ${customer_email}.`
  };
}

/**
 * Get available services
 */
async function getAvailableServices(
  supabase: any,
  userId: string
): Promise<{ services: any[]; message: string }> {
  const { data: config } = await supabase
    .from('business_config')
    .select('services')
    .eq('user_id', userId)
    .single();

  if (!config?.services) {
    return {
      services: [],
      message: 'No services are currently available.'
    };
  }

  const services = Array.isArray(config.services) ? config.services : [];

  const formattedServices = services
    .filter((s: any) => s.name || s.name_en)
    .map((s: any) => ({
      name: s.name_en || s.name,
      price: s.price ? `$${s.price}` : 'Price on request',
      duration: s.duration ? `${s.duration} minutes` : null,
      description: s.description_en || s.description || null
    }));

  const serviceList = formattedServices
    .map((s: any) => `${s.name} - ${s.price}${s.duration ? ` (${s.duration})` : ''}`)
    .join(', ');

  return {
    services: formattedServices,
    message: `We offer the following services: ${serviceList}`
  };
}
