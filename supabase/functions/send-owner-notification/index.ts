import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

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
    const { userId, trigger, bookingDetails } = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch business config
    const { data: config, error: configError } = await supabase
      .from('business_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !config) {
      console.error('Business config not found:', configError);
      throw new Error('Business config not found');
    }

    // Check if this trigger is enabled
    const triggers = config.notification_triggers || [];
    if (!triggers.includes(trigger)) {
      console.log(`Trigger ${trigger} not enabled for user ${userId}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Trigger not enabled' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const message = `New ${trigger} for ${config.business_name}: ${JSON.stringify(bookingDetails)}`;

    // Send email notification
    if (config.send_owner_email && config.owner_notification_email && RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${config.business_name} <notifications@resend.dev>`,
            to: [config.owner_notification_email],
            subject: `${config.business_name} - ${trigger}`,
            html: `<p>${message}</p>`,
          }),
        });
        console.log('Owner email notification sent');
      } catch (emailError) {
        console.error('Error sending owner email:', emailError);
      }
    }

    // Send SMS notification
    if (config.send_owner_sms && config.owner_notification_phone && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      try {
        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const formData = new URLSearchParams();
        formData.append('From', TWILIO_PHONE_NUMBER!);
        formData.append('To', config.owner_notification_phone);
        formData.append('Body', message);

        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          }
        );
        console.log('Owner SMS notification sent');
      } catch (smsError) {
        console.error('Error sending owner SMS:', smsError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error sending owner notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
