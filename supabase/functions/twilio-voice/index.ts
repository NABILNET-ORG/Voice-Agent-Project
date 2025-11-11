import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Store active calls for call logging
const activeCalls = new Map<string, {
  userId: string | null;
  callLogId: string | null;
  transcript: Array<{ role: string; content: string }>;
  startedAt: string;
}>();

serve(async (req) => {
  const url = new URL(req.url);

  // Handle /status endpoint - receives call status updates from Twilio
  if (url.pathname.endsWith('/status')) {
    try {
      const formData = await req.formData();
      const callSid = formData.get('CallSid') as string;
      const callStatus = formData.get('CallStatus') as string;

      console.log('Call status update:', callSid, callStatus);

      // Only process completed calls
      if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
        const callInfo = activeCalls.get(callSid);

        if (callInfo && callInfo.callLogId) {
          const endedAt = new Date().toISOString();
          const startedAt = new Date(callInfo.startedAt);
          const durationSeconds = Math.floor((new Date(endedAt).getTime() - startedAt.getTime()) / 1000);

          // Determine outcome
          let outcome = 'completed';
          if (callStatus === 'failed') outcome = 'failed';
          else if (callStatus === 'busy') outcome = 'busy';
          else if (callStatus === 'no-answer') outcome = 'no_answer';

          // Update call log
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
          const { error: updateError } = await supabase
            .from('call_logs')
            .update({
              ended_at: endedAt,
              duration_seconds: durationSeconds,
              outcome: outcome,
              transcript: callInfo.transcript,
            })
            .eq('id', callInfo.callLogId);

          if (updateError) {
            console.error('Error updating call log:', updateError);
          } else {
            console.log('Call log updated:', callInfo.callLogId);
          }

          // Clean up active calls
          activeCalls.delete(callSid);
        }
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Error handling status callback:', error);
      return new Response('Error', { status: 500 });
    }
  }

  // Handle /twiml endpoint - returns TwiML to connect call to Realtime API
  if (url.pathname.endsWith('/twiml')) {
    try {
      console.log('Incoming call request');

      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      // Parse form data from Twilio
      const formData = await req.formData();
      const callSid = formData.get('CallSid') as string;
      const fromNumber = formData.get('From') as string;

      console.log('Call from:', fromNumber, 'SID:', callSid);

      // Look up user by phone number
      let userId: string | null = null;
      let userName: string | null = null;

      try {
        const userLookup = await fetch(`${SUPABASE_URL}/functions/v1/get-user-by-phone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ phoneNumber: fromNumber }),
        });

        if (userLookup.ok) {
          const userData = await userLookup.json();
          if (userData.success && userData.user_id) {
            userId = userData.user_id;
            userName = userData.full_name;
            console.log('User identified:', userName, userId);
          } else {
            console.log('No user found for phone:', fromNumber);
          }
        }
      } catch (lookupError) {
        console.error('Error looking up user:', lookupError);
        // Continue anyway - we'll handle unknown callers
      }

      // Create call log entry
      let callLogId: string | null = null;
      if (userId) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
          const { data: callLog, error: logError } = await supabase
            .from('call_logs')
            .insert({
              user_id: userId,
              call_sid: callSid,
              customer_phone: fromNumber,
              started_at: new Date().toISOString(),
              outcome: 'in_progress',
            })
            .select()
            .single();

          if (logError) {
            console.error('Error creating call log:', logError);
          } else {
            callLogId = callLog.id;
            console.log('Call log created:', callLogId);
          }
        } catch (logCreateError) {
          console.error('Error creating call log:', logCreateError);
        }
      }

      // Store call info for later updates
      activeCalls.set(callSid, {
        userId,
        callLogId,
        transcript: [],
        startedAt: new Date().toISOString(),
      });

      // Create ephemeral token for this call
      const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy',
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create OpenAI session');
      }

      const session = await sessionResponse.json();
      const ephemeralToken = session.client_secret?.value;

      if (!ephemeralToken) {
        throw new Error('No ephemeral token received');
      }

      // Return TwiML to connect to OpenAI Realtime API
      // Include status callback so we get notified when call ends
      const statusCallbackUrl = `${SUPABASE_URL}/functions/v1/twilio-voice/status`;

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect action="${statusCallbackUrl}">
    <Stream url="wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17">
      <Parameter name="authorization" value="Bearer ${ephemeralToken}" />
      <Parameter name="temperature" value="0.7" />
    </Stream>
  </Connect>
</Response>`;

      return new Response(twiml, {
        headers: {
          'Content-Type': 'text/xml',
        },
      });
    } catch (error) {
      console.error('Error generating TwiML:', error);

      // Return error TwiML
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, we're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;

      return new Response(errorTwiml, {
        status: 500,
        headers: {
          'Content-Type': 'text/xml',
        },
      });
    }
  }

  // Handle WebSocket connection for Realtime API events
  if (req.headers.get('upgrade') === 'websocket') {
    console.log('WebSocket connection initiated');

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message.type);

        // Handle tool calls from OpenAI
        if (message.type === 'response.function_call_arguments.done') {
          const functionName = message.name;
          const args = JSON.parse(message.arguments);

          console.log(`Function call: ${functionName}`, args);

          let result;

          switch (functionName) {
            case 'check_calendar':
              result = await handleCheckCalendar(args);
              break;
            case 'create_booking':
              result = await handleCreateBooking(args);
              break;
            default:
              result = { error: 'Unknown function' };
          }

          // Send function result back to OpenAI
          socket.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: message.call_id,
              output: JSON.stringify(result),
            },
          }));

          // Trigger response generation
          socket.send(JSON.stringify({ type: 'response.create' }));
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
    };

    return response;
  }

  // Default response for other paths
  return new Response('Twilio Voice Handler', { status: 200 });
});

// Helper: Check calendar availability
async function handleCheckCalendar(args: { service: string; preferredDate?: string; preferredTime?: string; userId?: string }) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Call google-calendar-check function
    const response = await fetch(`${supabaseUrl}/functions/v1/google-calendar-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        service: args.service,
        preferredDate: args.preferredDate,
        preferredTime: args.preferredTime,
        userId: args.userId,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error checking calendar:', error);
    return { available: [], error: error.message };
  }
}

// Helper: Create booking
async function handleCreateBooking(args: {
  userId: string;
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  customerEmail?: string;
  notes?: string;
}) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's business config
    const { data: config } = await supabase
      .from('business_config')
      .select('*')
      .eq('user_id', args.userId)
      .single();

    if (!config) {
      return { success: false, error: 'Business config not found' };
    }

    // Find service details
    const services = config.services as Array<{ name: string; duration: number; price: number }>;
    const serviceDetails = services.find(s => s.name.toLowerCase() === args.service.toLowerCase());

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: args.userId,
        customer_name: args.customerName,
        customer_phone: args.customerPhone,
        customer_email: args.customerEmail,
        service_or_item: args.service,
        booking_type: config.business_category === 'delivery' ? 'delivery' : 'appointment',
        date: args.date,
        time: args.time,
        duration_minutes: serviceDetails?.duration || 60,
        base_price: serviceDetails?.price,
        total_amount: serviceDetails?.price,
        status: 'confirmed',
        notes: args.notes,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return { success: false, error: bookingError.message };
    }

    console.log('Booking created:', booking.id);

    // Send confirmation SMS
    if (config.customer_notification_sms && args.customerPhone) {
      const message = config.confirmation_template
        .replace('{customer_name}', args.customerName)
        .replace('{service}', args.service)
        .replace('{date}', args.date)
        .replace('{time}', args.time)
        .replace('{business_name}', config.business_name);

      await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: args.customerPhone, message }),
      });
    }

    // Send confirmation email
    if (config.customer_notification_email && args.customerEmail) {
      await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: args.customerEmail,
          customerName: args.customerName,
          businessName: config.business_name,
          service: args.service,
          date: args.date,
          time: args.time,
        }),
      });
    }

    // Create Google Calendar event
    if (config.google_calendar_sync_enabled) {
      const startDateTime = new Date(`${args.date}T${args.time}`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + (serviceDetails?.duration || 60) * 60000).toISOString();

      await fetch(`${supabaseUrl}/functions/v1/google-calendar-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: args.userId,
          bookingId: booking.id,
          summary: `${args.service} - ${args.customerName}`,
          description: `Customer: ${args.customerName}\nPhone: ${args.customerPhone}`,
          startDateTime,
          endDateTime,
        }),
      });
    }

    // Notify owner
    await fetch(`${supabaseUrl}/functions/v1/send-owner-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: args.userId,
        trigger: 'new_booking',
        bookingDetails: {
          customer: args.customerName,
          service: args.service,
          date: args.date,
          time: args.time,
        },
      }),
    });

    return {
      success: true,
      booking_id: booking.id,
      message: 'Booking confirmed!',
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
}
