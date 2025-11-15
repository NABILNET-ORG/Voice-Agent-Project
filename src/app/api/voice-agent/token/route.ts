import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/voice-agent/token
 * Generate ephemeral OpenAI Realtime API token
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get business config to retrieve OpenAI API key
    const { data: config, error: configError } = await supabase
      .from('business_config')
      .select('openai_api_key, openai_model_provider, openai_model_name')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        {
          error: 'Business configuration not found',
          message: 'Please configure your OpenAI API key in Settings > AI Integrations'
        },
        { status: 404 }
      );
    }

    // Get OpenAI API key from environment or database
    const openaiApiKey = process.env.OPENAI_API_KEY || config.openai_api_key;

    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          message: 'Please add your OpenAI API key in Settings > AI Integrations or set OPENAI_API_KEY environment variable'
        },
        { status: 400 }
      );
    }

    // Get voice agent context
    const contextResponse = await fetch(`${request.nextUrl.origin}/api/voice-agent/context`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    let instructions = 'You are a helpful AI assistant for booking appointments and answering questions.';

    if (contextResponse.ok) {
      const contextData = await contextResponse.json();
      instructions = buildInstructions(contextData);
    }

    // Create ephemeral token using OpenAI's realtime session endpoint
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.openai_model_name || 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
        instructions: instructions,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        },
        tools: [
          {
            type: 'function',
            name: 'check_availability',
            description: 'Check if a specific time slot is available for booking',
            parameters: {
              type: 'object',
              properties: {
                date: {
                  type: 'string',
                  description: 'Date in YYYY-MM-DD format'
                },
                time: {
                  type: 'string',
                  description: 'Time in HH:MM format (24-hour)'
                }
              },
              required: ['date', 'time']
            }
          },
          {
            type: 'function',
            name: 'create_booking',
            description: 'Create a new booking appointment',
            parameters: {
              type: 'object',
              properties: {
                customer_name: {
                  type: 'string',
                  description: 'Customer full name'
                },
                customer_email: {
                  type: 'string',
                  description: 'Customer email address'
                },
                customer_phone: {
                  type: 'string',
                  description: 'Customer phone number (optional)'
                },
                service_name: {
                  type: 'string',
                  description: 'Name of the service to book'
                },
                date: {
                  type: 'string',
                  description: 'Booking date in YYYY-MM-DD format'
                },
                time: {
                  type: 'string',
                  description: 'Booking time in HH:MM format (24-hour)'
                },
                notes: {
                  type: 'string',
                  description: 'Optional booking notes or special requests'
                }
              },
              required: ['customer_name', 'customer_email', 'service_name', 'date', 'time']
            }
          },
          {
            type: 'function',
            name: 'get_available_services',
            description: 'Get list of available services with prices',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI Realtime API error:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to create realtime session',
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      client_secret: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
      session_id: data.id,
      model: data.model,
      voice: data.voice
    });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/voice-agent/token:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Build instructions for the voice agent based on business context
 */
function buildInstructions(context: any): string {
  const businessInfo = context.businessInfo || {};
  const services = context.services || [];
  const schedule = context.schedule || {};

  let instructions = `You are ${businessInfo.business_name || 'an AI assistant'}, a professional voice booking agent.\n\n`;

  if (businessInfo.description) {
    instructions += `Business Description: ${businessInfo.description}\n\n`;
  }

  instructions += `Your role:\n`;
  instructions += `- Help customers book appointments for our services\n`;
  instructions += `- Answer questions about our services, pricing, and availability\n`;
  instructions += `- Collect necessary booking information (name, email, phone, preferred date/time)\n`;
  instructions += `- Be friendly, professional, and concise\n`;
  instructions += `- Speak naturally like a human assistant\n\n`;

  if (services.length > 0) {
    instructions += `Available Services:\n`;
    services.forEach((service: any) => {
      const name = service.name_en || service.name || 'Unknown';
      const price = service.price ? ` - $${service.price}` : '';
      const duration = service.duration ? ` (${service.duration} min)` : '';
      instructions += `- ${name}${price}${duration}\n`;
    });
    instructions += `\n`;
  }

  if (schedule.business_hours) {
    instructions += `Business Hours:\n${JSON.stringify(schedule.business_hours, null, 2)}\n\n`;
  }

  instructions += `Important:\n`;
  instructions += `- Always confirm booking details before creating a booking\n`;
  instructions += `- Check availability before confirming a time slot\n`;
  instructions += `- Ask for customer email (required for booking confirmation)\n`;
  instructions += `- Be helpful and answer questions about our services\n`;
  instructions += `- Keep responses concise and natural\n`;

  return instructions;
}
