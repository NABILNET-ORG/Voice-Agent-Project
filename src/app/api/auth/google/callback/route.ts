import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

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

    // Create a redirect URL with token data embedded
    // The frontend will save these using an authenticated API call
    const redirectUrl = new URL('/settings/integrations', request.url);
    redirectUrl.searchParams.set('google_oauth_success', 'true');
    redirectUrl.searchParams.set('access_token', tokens.access_token);
    redirectUrl.searchParams.set('refresh_token', tokens.refresh_token || '');
    redirectUrl.searchParams.set('expires_in', tokens.expires_in.toString());
    redirectUrl.searchParams.set('user_id', state);

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=oauth_failed&message=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}
