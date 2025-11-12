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
    const { bookingId, cancellationReason } = await req.json();

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Get the booking to verify ownership
    const { data: existingBooking, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('*, business_config!inner(user_id, business_name)')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingBooking) throw new Error('Booking not found');

    // Verify user owns this booking's business
    if (existingBooking.business_config.user_id !== user.id) {
      throw new Error('Unauthorized to cancel this booking');
    }

    // Update booking status to cancelled
    const { data: cancelledBooking, error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        status: 'cancelled',
        notes: cancellationReason
          ? `${existingBooking.notes || ''}\n\nCancellation reason: ${cancellationReason}`.trim()
          : existingBooking.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Delete Google Calendar event if synced
    if (existingBooking.calendar_event_id) {
      try {
        // TODO: Implement Google Calendar event deletion
        // This would require OAuth tokens and calendar API access
        console.log('Calendar event deletion not yet implemented:', existingBooking.calendar_event_id);
      } catch (calendarError) {
        console.error('Error deleting calendar event:', calendarError);
        // Don't fail the cancellation if calendar deletion fails
      }
    }

    // Send cancellation notification
    try {
      const businessName = existingBooking.business_config.business_name;

      if (existingBooking.customer_phone) {
        // Send SMS notification
        await supabaseClient.functions.invoke('send-sms', {
          body: {
            to: existingBooking.customer_phone,
            message: `Your booking with ${businessName} for ${existingBooking.service_or_item} on ${existingBooking.scheduled_at.split('T')[0]} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
          },
        });
      }

      if (existingBooking.customer_email) {
        // Send email notification
        await supabaseClient.functions.invoke('send-confirmation-email', {
          body: {
            to: existingBooking.customer_email,
            subject: 'Booking Cancelled',
            bookingDetails: {
              customerName: existingBooking.customer_name,
              service: existingBooking.service_or_item,
              date: existingBooking.scheduled_at.split('T')[0],
              time: existingBooking.scheduled_at.split('T')[1].slice(0, 5),
              businessName,
              status: 'cancelled',
              cancellationReason,
            },
          },
        });
      }
    } catch (notificationError) {
      // Log but don't fail if notifications fail
      console.error('Error sending cancellation notifications:', notificationError);
    }

    return new Response(JSON.stringify({ success: true, booking: cancelledBooking }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
