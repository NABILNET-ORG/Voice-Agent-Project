import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get request body
    const {
      bookingId,
      serviceOrItem,
      date,
      time,
      durationMinutes,
      basePrice,
      totalAmount,
      deliveryAddress,
      notes,
      status,
    } = await req.json();

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Get the booking to verify ownership
    const { data: existingBooking, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('*, business_config!inner(user_id)')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingBooking) throw new Error('Booking not found');

    // Verify user owns this booking's business
    if (existingBooking.business_config.user_id !== user.id) {
      throw new Error('Unauthorized to update this booking');
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (serviceOrItem !== undefined) updateData.service_or_item = serviceOrItem;
    if (date !== undefined && time !== undefined) {
      updateData.scheduled_at = `${date}T${time}:00`;
    }
    if (durationMinutes !== undefined) updateData.duration_minutes = durationMinutes;
    if (basePrice !== undefined) updateData.base_price = basePrice;
    if (totalAmount !== undefined) updateData.total_amount = totalAmount;
    if (deliveryAddress !== undefined) updateData.delivery_address = deliveryAddress;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send update notification (optional - only if configured)
    try {
      const { data: config } = await supabaseClient
        .from('business_config')
        .select('phone_number, business_name')
        .eq('user_id', user.id)
        .single();

      if (existingBooking.customer_phone) {
        // Send SMS notification
        await supabaseClient.functions.invoke('send-sms', {
          body: {
            to: existingBooking.customer_phone,
            message: `Your booking with ${config?.business_name || 'us'} has been updated. New details: ${serviceOrItem || existingBooking.service_or_item} on ${date || existingBooking.scheduled_at.split('T')[0]} at ${time || existingBooking.scheduled_at.split('T')[1].slice(0, 5)}.`,
          },
        });
      }

      if (existingBooking.customer_email) {
        // Send email notification
        await supabaseClient.functions.invoke('send-confirmation-email', {
          body: {
            to: existingBooking.customer_email,
            subject: 'Booking Updated',
            bookingDetails: {
              customerName: existingBooking.customer_name,
              service: serviceOrItem || existingBooking.service_or_item,
              date: date || existingBooking.scheduled_at.split('T')[0],
              time: time || existingBooking.scheduled_at.split('T')[1].slice(0, 5),
              businessName: config?.business_name || 'Business',
            },
          },
        });
      }
    } catch (notificationError) {
      // Log but don't fail if notifications fail
      console.error('Error sending notifications:', notificationError);
    }

    return new Response(JSON.stringify({ success: true, booking: updatedBooking }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
