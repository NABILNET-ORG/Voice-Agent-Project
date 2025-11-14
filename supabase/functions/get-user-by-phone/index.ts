import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Handle CORS
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
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      throw new Error('Missing required field: phoneNumber');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    console.log('Looking up user by phone:', normalizedPhone);

    // Query profiles table for matching phone number
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('phone_number', normalizedPhone)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!profile) {
      console.log('No user found for phone:', normalizedPhone);
      return new Response(
        JSON.stringify({
          success: false,
          user_id: null,
          message: 'No user found with this phone number',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('User found:', profile.id, profile.full_name);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: profile.id,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in get-user-by-phone:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        user_id: null,
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
