import { NextResponse } from "next/server";
import { createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : 'http://localhost:3000/api/auth/google/callback';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This is the user_id
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${error}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=missing_code', request.url)
    );
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=oauth_not_configured', request.url)
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    // Store tokens in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_calendar_access_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token,
        google_calendar_token_expiry: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
      })
      .eq('id', state);

    if (updateError) {
      throw updateError;
    }

    // Also enable Google Calendar sync in business_config
    await supabase
      .from('business_config')
      .update({
        google_calendar_sync_enabled: true,
      })
      .eq('user_id', state);

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      new URL('/settings/integrations?success=google_calendar_connected', request.url)
    );
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(
      new URL('/settings/integrations?error=oauth_failed', request.url)
    );
  }
}
