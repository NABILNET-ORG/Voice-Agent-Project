import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { accessToken, refreshToken, expiresIn, userId } = await request.json();

    console.log('Save tokens API called:', { userId, has_access: !!accessToken, has_refresh: !!refreshToken });

    if (!accessToken || !userId) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Store tokens in profiles table (RLS allows users to update their own profile)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        google_calendar_access_token: accessToken,
        google_calendar_refresh_token: refreshToken,
        google_calendar_token_expiry: new Date(
          Date.now() + expiresIn * 1000
        ).toISOString(),
      })
      .eq('id', userId)
      .select();

    console.log('Profile update result:', { success: !profileError, updated: profileData?.length });

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Failed to save tokens', details: profileError.message },
        { status: 500 }
      );
    }

    // Enable Google Calendar sync in business_config
    const { data: configData, error: configError } = await supabase
      .from('business_config')
      .update({
        google_calendar_sync_enabled: true,
      })
      .eq('user_id', userId)
      .select();

    console.log('Config update result:', { success: !configError, updated: configData?.length });

    if (configError) {
      console.error('Config update error:', configError);
      return NextResponse.json(
        { error: 'Failed to enable sync', details: configError.message },
        { status: 500 }
      );
    }

    console.log('✅ Google Calendar connected successfully for user:', userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save tokens error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
