import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      serviceOrItem,
      bookingType,
      date,
      time,
      durationMinutes,
      basePrice,
      totalAmount,
      deliveryAddress,
      notes,
    } = await req.json();

    // Validate required fields
    if (!customerName || !customerPhone || !serviceOrItem || !bookingType || !date || !time) {
      throw new Error('Missing required fields');
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log('Creating manual booking for user:', user.id);

    // Get user's business config
    const { data: config, error: configError } = await supabase
      .from('business_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      console.error('Business config not found:', configError);
      throw new Error('Business configuration not found. Please configure your business settings first.');
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        service_or_item: serviceOrItem,
        booking_type: bookingType,
        date: date,
        time: time,
        duration_minutes: durationMinutes || 60,
        base_price: basePrice,
        total_amount: totalAmount,
        delivery_address: deliveryAddress,
        status: 'confirmed',
        notes: notes,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log('Booking created:', booking.id);

    // Send confirmation SMS if enabled
    if (config.customer_notification_sms && customerPhone) {
      try {
        const message = config.confirmation_template
          .replace('{customer_name}', customerName)
          .replace('{service}', serviceOrItem)
          .replace('{date}', date)
          .replace('{time}', time)
          .replace('{business_name}', config.business_name);

        await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: customerPhone,
            message: message,
          }),
        });

        console.log('Confirmation SMS sent');
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        // Don't fail the booking if SMS fails
      }
    }

    // Send confirmation email if enabled
    if (config.customer_notification_email && customerEmail) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: customerEmail,
            customerName: customerName,
            businessName: config.business_name,
            service: serviceOrItem,
            date: date,
            time: time,
          }),
        });

        console.log('Confirmation email sent');
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the booking if email fails
      }
    }

    // Create Google Calendar event if enabled
    if (config.google_calendar_sync_enabled) {
      try {
        const startDateTime = new Date(`${date}T${time}`).toISOString();
        const endDateTime = new Date(
          new Date(startDateTime).getTime() + (durationMinutes || 60) * 60000
        ).toISOString();

        await fetch(`${supabaseUrl}/functions/v1/google-calendar-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            userId: user.id,
            bookingId: booking.id,
            summary: `${serviceOrItem} - ${customerName}`,
            description: `Customer: ${customerName}\nPhone: ${customerPhone}${
              customerEmail ? `\nEmail: ${customerEmail}` : ''
            }${notes ? `\n\nNotes: ${notes}` : ''}`,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
          }),
        });

        console.log('Google Calendar event created');
      } catch (calendarError) {
        console.error('Error creating calendar event:', calendarError);
        // Don't fail the booking if calendar fails
      }
    }

    // Notify owner if enabled
    if (config.owner_notification_sms || config.owner_notification_email) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-owner-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            userId: user.id,
            trigger: 'new_booking',
            bookingDetails: {
              customer: customerName,
              service: serviceOrItem,
              date: date,
              time: time,
              type: bookingType,
            },
          }),
        });

        console.log('Owner notification sent');
      } catch (notificationError) {
        console.error('Error sending owner notification:', notificationError);
        // Don't fail the booking if notification fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: booking,
        message: 'Booking created successfully',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in create-booking-manual:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
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
