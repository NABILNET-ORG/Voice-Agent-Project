import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/voice-agent/twilio-webhook
 * Handle incoming Twilio phone calls and route to voice agent
 *
 * Twilio Configuration:
 * 1. Buy a phone number in Twilio Console
 * 2. Configure Voice webhook URL: https://yourdomain.com/api/voice-agent/twilio-webhook
 * 3. Set HTTP method: POST
 * 4. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env.local
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract Twilio call parameters
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;

    console.log('[Twilio Webhook] Incoming call:', { callSid, from, to, callStatus });

    // Get business owner for this Twilio number
    const supabase = await createClient();

    const { data: config } = await supabase
      .from('business_config')
      .select('user_id, voice_agent_provider, business_name, voice_agent_personality')
      .eq('twilio_phone_number', to)
      .single();

    if (!config) {
      console.error('[Twilio Webhook] No business config found for number:', to);
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>This number is not configured. Please contact support.</Say>
          <Hangup/>
        </Response>`,
        {
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    // Create call log entry
    const { data: callLog, error: callLogError } = await supabase
      .from('call_logs')
      .insert({
        user_id: config.user_id,
        phone_number: from,
        call_sid: callSid,
        direction: 'inbound',
        status: callStatus,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (callLogError) {
      console.error('[Twilio Webhook] Failed to create call log:', callLogError);
    }

    // Route to appropriate voice agent based on configuration
    const provider = config.voice_agent_provider || 'openai';

    if (provider === 'openai') {
      // Route to OpenAI Realtime API
      return handleOpenAICall(config, callSid, from);
    } else if (provider === 'gemini') {
      // Route to Gemini Live API
      return handleGeminiCall(config, callSid, from);
    } else {
      // Default: simple greeting
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Hello from ${config.business_name || 'our business'}. Thank you for calling.</Say>
          <Say>To make a booking, please visit our website or use our web voice agent.</Say>
          <Hangup/>
        </Response>`,
        {
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

  } catch (error: any) {
    console.error('[Twilio Webhook] Error:', error);

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>We're experiencing technical difficulties. Please try again later.</Say>
        <Hangup/>
      </Response>`,
      {
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
}

/**
 * Route call to OpenAI Realtime API
 * Note: This requires Twilio Media Streams
 */
function handleOpenAICall(config: any, callSid: string, from: string) {
  // TwiML to connect call to Media Streams
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')}/api/voice-agent/stream?provider=openai&call_sid=${callSid}&from=${from}" />
      </Connect>
    </Response>`,
    {
      headers: { 'Content-Type': 'text/xml' },
    }
  );
}

/**
 * Route call to Gemini Live API
 * Note: This requires Twilio Media Streams
 */
function handleGeminiCall(config: any, callSid: string, from: string) {
  // TwiML to connect call to Media Streams
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')}/api/voice-agent/stream?provider=gemini&call_sid=${callSid}&from=${from}" />
      </Connect>
    </Response>`,
    {
      headers: { 'Content-Type': 'text/xml' },
    }
  );
}

/**
 * Handle call status updates
 * Twilio calls this endpoint with call status changes
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callSid = searchParams.get('CallSid');
  const callStatus = searchParams.get('CallStatus');
  const callDuration = searchParams.get('CallDuration');
  const recordingUrl = searchParams.get('RecordingUrl');

  console.log('[Twilio Status] Update:', { callSid, callStatus, callDuration });

  if (!callSid) {
    return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });
  }

  const supabase = await createClient();

  // Update call log
  const updateData: any = {
    status: callStatus,
    updated_at: new Date().toISOString(),
  };

  if (callDuration) {
    updateData.duration_seconds = parseInt(callDuration, 10);
  }

  if (recordingUrl) {
    updateData.recording_url = recordingUrl;
  }

  if (callStatus === 'completed') {
    updateData.ended_at = new Date().toISOString();
    updateData.outcome = 'completed';
  } else if (callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
    updateData.ended_at = new Date().toISOString();
    updateData.outcome = 'failed';
  }

  const { error } = await supabase
    .from('call_logs')
    .update(updateData)
    .eq('call_sid', callSid);

  if (error) {
    console.error('[Twilio Status] Failed to update call log:', error);
    return NextResponse.json({ error: 'Failed to update call log' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
