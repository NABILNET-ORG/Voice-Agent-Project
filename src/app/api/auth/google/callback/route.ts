import { NextResponse } from "next/server";

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

  console.log('OAuth callback received:', { code: code?.substring(0, 20), state, error });

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
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received:', {
      access_token: tokens.access_token?.substring(0, 20),
      has_refresh: !!tokens.refresh_token,
      expires_in: tokens.expires_in
    });

    // Use Supabase with service role key to bypass RLS
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

    console.log('Supabase config:', {
      url: supabaseUrl,
      keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON',
      keyLength: supabaseKey.length,
      keyStart: supabaseKey.substring(0, 20),
      urlLength: supabaseUrl.length
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key is missing');
    }

    // Use direct REST API instead of Supabase client to avoid key issues
    const restUrl = `${supabaseUrl}/rest/v1`;

    // Update profiles table using REST API
    const profileUrl = `${restUrl}/profiles?id=eq.${state}`;
    console.log('Making PATCH request to:', profileUrl);

    const profileResponse = await fetch(profileUrl, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        google_calendar_access_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token,
        google_calendar_token_expiry: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
      })
    });

    console.log('Profile update response:', {
      status: profileResponse.status,
      ok: profileResponse.ok
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error('Profile update failed:', error);
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=db_update_failed&message=${encodeURIComponent(error)}`, request.url)
      );
    }

    const profileData = await profileResponse.json();
    console.log('Profile updated successfully:', profileData);

    // Enable Google Calendar sync in business_config
    const configResponse = await fetch(`${restUrl}/business_config?user_id=eq.${state}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        google_calendar_sync_enabled: true,
      })
    });

    console.log('Config update response:', {
      status: configResponse.status,
      ok: configResponse.ok
    });

    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('Config updated successfully:', configData);
    }

    // Redirect back WITHOUT tokens in URL to preserve session
    return NextResponse.redirect(
      new URL('/settings/integrations?success=google_calendar_connected', request.url)
    );
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=oauth_failed&message=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}
