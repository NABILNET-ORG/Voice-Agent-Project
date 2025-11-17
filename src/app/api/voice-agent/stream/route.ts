import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/voice-agent/stream
 * WebSocket endpoint for Twilio Media Streams
 *
 * This endpoint receives audio streams from Twilio phone calls
 * and routes them to OpenAI Realtime API or Gemini Live API
 *
 * Note: Next.js 15 doesn't natively support WebSocket upgrades in API routes.
 * For production, consider using:
 * 1. Separate WebSocket server (Socket.io, ws)
 * 2. Vercel Edge Functions with WebSocket support
 * 3. Custom server.js with http.createServer()
 *
 * This is a placeholder implementation. For full Twilio Media Streams support,
 * you'll need to set up a dedicated WebSocket server.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get('provider');
  const callSid = searchParams.get('call_sid');
  const from = searchParams.get('from');

  console.log('[Stream] WebSocket connection requested:', { provider, callSid, from });

  // WebSocket upgrade is not supported in Next.js App Router API routes
  // Return helpful error message
  return new Response(
    JSON.stringify({
      error: 'WebSocket upgrade not supported in Next.js API routes',
      message: 'For Twilio Media Streams integration, deploy a separate WebSocket server',
      documentation: 'See SPRINT_3_IMPLEMENTATION.md for WebSocket server setup guide',
      alternatives: [
        'Use Twilio Studio with Connect widget',
        'Deploy separate Node.js WebSocket server',
        'Use Vercel Edge Runtime with WebSocket support',
        'Implement custom server.js with ws package'
      ],
      callDetails: {
        provider,
        callSid,
        from,
      }
    }),
    {
      status: 501,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Twilio Media Streams WebSocket Handler
 * This would be implemented in a separate WebSocket server
 *
 * Example implementation with ws package:
 *
 * ```typescript
 * import WebSocket from 'ws';
 * import { createServer } from 'http';
 *
 * const server = createServer();
 * const wss = new WebSocket.Server({ server });
 *
 * wss.on('connection', (ws, req) => {
 *   const url = new URL(req.url, 'http://localhost');
 *   const provider = url.searchParams.get('provider');
 *   const callSid = url.searchParams.get('call_sid');
 *
 *   // Connect to OpenAI or Gemini
 *   if (provider === 'openai') {
 *     const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime');
 *     // Pipe audio between Twilio and OpenAI
 *   } else if (provider === 'gemini') {
 *     const geminiWs = new WebSocket('wss://generativelanguage.googleapis.com/ws/v1beta/live');
 *     // Pipe audio between Twilio and Gemini
 *   }
 *
 *   ws.on('message', (data) => {
 *     const message = JSON.parse(data.toString());
 *
 *     if (message.event === 'media') {
 *       // Forward audio to AI provider
 *     } else if (message.event === 'start') {
 *       // Initialize AI session
 *     } else if (message.event === 'stop') {
 *       // Close AI session and save transcript
 *     }
 *   });
 * });
 *
 * server.listen(8080);
 * ```
 */

/**
 * Helper function to save call transcript
 */
async function saveCallTranscript(
  callSid: string,
  transcript: any,
  duration: number,
  outcome: string
) {
  const supabase = await createClient();

  await supabase
    .from('call_logs')
    .update({
      transcript,
      duration_seconds: duration,
      outcome,
      ended_at: new Date().toISOString(),
    })
    .eq('call_sid', callSid);
}

/**
 * Helper function to handle booking from phone call
 */
async function handlePhoneBooking(userId: string, bookingData: any) {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      customer_name: bookingData.customer_name,
      customer_phone: bookingData.customer_phone,
      customer_email: bookingData.customer_email,
      service_or_item: bookingData.service_name,
      date: bookingData.date,
      time: bookingData.time,
      duration_minutes: bookingData.duration_minutes || 60,
      base_price: bookingData.base_price || 0,
      total_amount: bookingData.total_amount || 0,
      status: 'pending',
      notes: 'Booked via phone call',
    })
    .select()
    .single();

  if (error) {
    console.error('[Phone Booking] Failed:', error);
    return null;
  }

  return booking;
}
