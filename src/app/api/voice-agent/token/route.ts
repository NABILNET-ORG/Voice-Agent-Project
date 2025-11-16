import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createGeminiLiveSession,
  buildGeminiSetupMessage,
  convertOpenAIToolsToGemini,
  GEMINI_VOICES
} from '@/lib/gemini-live/client';

/**
 * POST /api/voice-agent/token
 * Generate session credentials for voice agent (OpenAI or Gemini)
 * Supports dual-provider architecture based on business_config.ai_voice_agent_provider
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Voice Agent Token] Request received');
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[Voice Agent Token] Auth check:', { hasUser: !!user, authError: authError?.message });

    if (authError || !user) {
      console.error('[Voice Agent Token] Unauthorized:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get business config to retrieve API keys and provider preference
    console.log('[Voice Agent Token] Fetching business config for user:', user.id);
    const { data: config, error: configError } = await supabase
      .from('business_config')
      .select(`
        openai_api_key,
        openai_api_key_general,
        openai_api_key_voice,
        gemini_api_key,
        gemini_api_key_general,
        gemini_api_key_voice,
        openrouter_api_key,
        openrouter_api_key_general,
        openrouter_api_key_voice,
        ai_voice_agent_provider,
        voice_agent_provider,
        voice_agent_model,
        voice_agent_voice_name,
        voice_agent_personality,
        ai_voice
      `)
      .eq('user_id', user.id)
      .single();

    console.log('[Voice Agent Token] Config query result:', {
      hasConfig: !!config,
      configError: configError?.message,
      provider: config?.voice_agent_provider || config?.ai_voice_agent_provider
    });

    if (configError || !config) {
      console.error('[Voice Agent Token] Config error:', configError);
      return NextResponse.json(
        {
          error: 'Business configuration not found',
          message: 'Please configure your voice agent settings in Settings > AI Assistant Configuration',
          debug: {
            userId: user.id,
            error: configError?.message
          }
        },
        { status: 404 }
      );
    }

    // Determine which provider to use (new schema first, fallback to old)
    const provider = config.voice_agent_provider || config.ai_voice_agent_provider || 'gemini';
    const voiceModel = config.voice_agent_model || (provider === 'openai' ? 'gpt-4o-realtime-preview-2024-12-17' : 'gemini-2.0-flash-exp');
    const voiceName = config.voice_agent_voice_name || config.ai_voice || (provider === 'gemini' ? GEMINI_VOICES.PUCK : 'alloy');

    console.log('[Voice Agent Token] Voice configuration:', {
      provider,
      model: voiceModel,
      voice: voiceName,
      personality: config.voice_agent_personality
    });

    // Get API key based on provider (with fallback chain for backward compatibility)
    let apiKey: string | null = null;
    if (provider === 'openai') {
      apiKey = config.openai_api_key_voice || config.openai_api_key_general || config.openai_api_key || process.env.OPENAI_API_KEY;
      console.log('[Voice Agent Token] OpenAI key check:', {
        hasVoiceKey: !!config.openai_api_key_voice,
        hasGeneralKey: !!config.openai_api_key_general,
        hasLegacyKey: !!config.openai_api_key,
        hasEnvKey: !!process.env.OPENAI_API_KEY
      });
    } else if (provider === 'gemini') {
      apiKey = config.gemini_api_key_voice || config.gemini_api_key_general || config.gemini_api_key || process.env.GEMINI_API_KEY;
      console.log('[Voice Agent Token] Gemini key check:', {
        hasVoiceKey: !!config.gemini_api_key_voice,
        hasGeneralKey: !!config.gemini_api_key_general,
        hasLegacyKey: !!config.gemini_api_key,
        hasEnvKey: !!process.env.GEMINI_API_KEY
      });
    } else if (provider === 'openrouter') {
      apiKey = config.openrouter_api_key_voice || config.openrouter_api_key_general || config.openrouter_api_key || process.env.OPENROUTER_API_KEY;
      console.log('[Voice Agent Token] OpenRouter key check:', {
        hasVoiceKey: !!config.openrouter_api_key_voice,
        hasGeneralKey: !!config.openrouter_api_key_general,
        hasLegacyKey: !!config.openrouter_api_key,
        hasEnvKey: !!process.env.OPENROUTER_API_KEY
      });
    }

    if (!apiKey) {
      console.error('[Voice Agent Token] No API key found for provider:', provider);
      return NextResponse.json(
        {
          error: `${provider.toUpperCase()} API key not configured`,
          message: `Please add your ${provider.toUpperCase()} API key in Settings > AI Integrations or set ${provider.toUpperCase()}_API_KEY environment variable`,
          provider,
          debug: {
            provider,
            hasEnvKey: provider === 'openai' ? !!process.env.OPENAI_API_KEY : !!process.env.GEMINI_API_KEY,
            hasDbKey: provider === 'openai' ? !!config.openai_api_key : !!config.gemini_api_key
          }
        },
        { status: 400 }
      );
    }

    // Get voice agent context
    console.log('[Voice Agent Token] Fetching context from:', `${request.nextUrl.origin}/api/voice-agent/context`);
    const contextResponse = await fetch(`${request.nextUrl.origin}/api/voice-agent/context`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    console.log('[Voice Agent Token] Context response status:', contextResponse.status);

    let instructions = 'You are a helpful AI assistant for booking appointments and answering questions.';

    if (contextResponse.ok) {
      const contextData = await contextResponse.json();
      instructions = buildInstructions(contextData);
      console.log('[Voice Agent Token] Instructions built, length:', instructions.length);
    } else {
      console.warn('[Voice Agent Token] Context fetch failed, using default instructions');
    }

    // Define function tools (same for both providers)
    const tools = [
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
    ];

    // Handle provider-specific session creation
    console.log('[Voice Agent Token] Creating session for provider:', provider);

    if (provider === 'openai') {
      // Create ephemeral token using OpenAI's realtime session endpoint
      console.log('[Voice Agent Token] Calling OpenAI Realtime API...');
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: voiceModel,
          voice: voiceName, // Provider-specific voice
          instructions: instructions,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.6,           // Higher threshold = less sensitive (was 0.5)
            prefix_padding_ms: 300,
            silence_duration_ms: 700  // Wait 700ms of silence before responding (was 200ms)
          },
          tools
        })
      });

      console.log('[Voice Agent Token] OpenAI response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Voice Agent Token] OpenAI Realtime API error:', errorData);
        return NextResponse.json(
          {
            error: 'Failed to create realtime session',
            details: errorData,
            provider: 'openai'
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('[Voice Agent Token] OpenAI session created:', data.id);

      return NextResponse.json({
        provider: 'openai',
        client_secret: data.client_secret.value,
        expires_at: data.client_secret.expires_at,
        session_id: data.id,
        model: data.model,
        voice: data.voice,
        ws_url: `wss://api.openai.com/v1/realtime?model=${data.model}`
      });

    } else if (provider === 'gemini') {
      console.log('[Voice Agent Token] Creating Gemini session...');

      // Validate voice is Gemini-compatible (already done above in voiceName)
      const geminiVoices = Object.values(GEMINI_VOICES);
      const selectedVoice = geminiVoices.includes(voiceName as any)
        ? voiceName
        : GEMINI_VOICES.PUCK;

      console.log('[Voice Agent Token] Gemini voice validation:', {
        requestedVoice: voiceName,
        isGeminiVoice: geminiVoices.includes(voiceName as any),
        finalVoice: selectedVoice
      });

      // Gemini doesn't use ephemeral tokens - client connects directly with API key
      // We return WebSocket URL and setup configuration
      const wsUrl = await createGeminiLiveSession({
        apiKey,
        model: voiceModel,
        systemInstruction: instructions,
        tools: convertOpenAIToolsToGemini(tools),
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedVoice
            }
          }
        }
      });

      // Build setup message for client
      const setupMessage = buildGeminiSetupMessage({
        apiKey,
        model: voiceModel,
        systemInstruction: instructions,
        tools: convertOpenAIToolsToGemini(tools),
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedVoice
            }
          }
        }
      });

      console.log('[Voice Agent Token] Gemini session created, returning credentials');

      return NextResponse.json({
        provider: 'gemini',
        ws_url: wsUrl,
        setup_message: setupMessage,
        model: voiceModel,
        voice: selectedVoice,
        personality: config.voice_agent_personality,
        session_id: `gemini-${Date.now()}`
      });
    }

    // Unsupported provider
    console.error('[Voice Agent Token] Unsupported provider:', provider);
    return NextResponse.json(
      {
        error: `Unsupported provider: ${provider}`,
        message: 'Please select either "openai" or "gemini" as your voice agent provider'
      },
      { status: 400 }
    );

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
  const aiConfig = context.aiConfig || {};
  const businessInfo = context.business || {};
  const services = context.services || [];
  const schedule = context.schedule || {};

  // Use custom instructions from Settings if available
  if (aiConfig.systemInstructions && aiConfig.systemInstructions.trim()) {
    let instructions = aiConfig.systemInstructions + '\n\n';

    // Add greeting template if available
    if (aiConfig.greetingTemplate && aiConfig.greetingTemplate.trim()) {
      instructions += `Greeting: ${aiConfig.greetingTemplate}\n\n`;
    }

    // Add date/time formatting instructions
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    instructions += `IMPORTANT - Date/Time Formatting:\n`;
    instructions += `Today's date is: ${today.toISOString().split('T')[0]}\n`;
    instructions += `Tomorrow's date is: ${tomorrow.toISOString().split('T')[0]}\n`;
    instructions += `When user says "لبكرة" or "tomorrow", use: ${tomorrow.toISOString().split('T')[0]}\n`;
    instructions += `When user says "اليوم" or "today", use: ${today.toISOString().split('T')[0]}\n`;
    instructions += `Time format: Always use 24-hour format HH:MM (e.g., 14:30 for 2:30 PM)\n`;
    instructions += `Examples:\n`;
    instructions += `- "عشرة ونص صباح" = 10:30\n`;
    instructions += `- "تلاتة بعد الظهر" = 15:00\n`;
    instructions += `- "سبعة مسا" = 19:00\n\n`;

    // Append available services
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

    return instructions;
  }

  // Fallback to auto-generated instructions if no custom instructions
  let instructions = `You are a helpful and friendly assistant for ${businessInfo.name || 'our business'}. `;
  instructions += `Speak naturally and conversationally, like you're having a real phone call with a customer.\n\n`;

  if (businessInfo.description) {
    instructions += `About us: ${businessInfo.description}\n\n`;
  }

  instructions += `Communication Style:\n`;
  instructions += `- Use natural, casual language like a real person\n`;
  instructions += `- Keep responses brief and to the point (1-2 sentences)\n`;
  instructions += `- Use contractions (I'm, you're, we're, can't, don't)\n`;
  instructions += `- Avoid robotic or formal language\n`;
  instructions += `- Show empathy and enthusiasm\n`;
  instructions += `- Speak in a warm, friendly tone\n\n`;

  instructions += `Your job:\n`;
  instructions += `- Help customers book appointments\n`;
  instructions += `- Answer questions about services and pricing\n`;
  instructions += `- Collect: name, email, phone, preferred date/time\n`;
  instructions += `- Be helpful and make booking easy\n\n`;

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

  instructions += `Important Guidelines:\n`;
  instructions += `- Confirm booking details before finalizing\n`;
  instructions += `- Check availability before committing to a time\n`;
  instructions += `- Always get customer email for confirmation\n`;
  instructions += `- If you don't know something, be honest and helpful\n`;
  instructions += `- Sound like you're genuinely interested in helping\n`;

  return instructions;
}
