/**
 * Gemini Live API Client
 *
 * Implements WebSocket-based bidirectional audio streaming with Google's Gemini Live API
 * Documentation: https://ai.google.dev/api/multimodal-live
 *
 * Features:
 * - Real-time voice conversation (16kHz PCM16 input, 24kHz output)
 * - Function calling for booking operations
 * - Server-side VAD (Voice Activity Detection)
 * - Audio streaming with base64 encoding
 *
 * Cost: ~$0.016/min (19x cheaper than OpenAI Realtime API)
 * Models: gemini-2.0-flash-exp (recommended for voice)
 */

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string; // Default: gemini-2.0-flash-exp
  systemInstruction?: string;
  tools?: GeminiTool[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
  speechConfig?: {
    voiceConfig?: {
      prebuiltVoiceConfig?: {
        voiceName: string; // e.g., "Puck", "Charon", "Kore", "Fenrir", "Aoede"
      };
    };
  };
}

export interface GeminiTool {
  functionDeclarations: GeminiFunctionDeclaration[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

export interface GeminiLiveSession {
  ws: WebSocket | null;
  config: GeminiLiveConfig;
  isConnected: boolean;
  sessionId?: string;
}

/**
 * Create a Gemini Live API WebSocket connection
 */
export async function createGeminiLiveSession(
  config: GeminiLiveConfig
): Promise<string> {
  const model = config.model || 'gemini-2.0-flash-exp';

  // Gemini Live API uses wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${config.apiKey}`;

  return wsUrl;
}

/**
 * Build setup message for Gemini Live API
 */
export function buildGeminiSetupMessage(config: GeminiLiveConfig): any {
  // Convert camelCase to snake_case for Gemini API
  const speechConfig = config.speechConfig || {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: 'Puck'
      }
    }
  };

  const setupMessage: any = {
    setup: {
      model: `models/${config.model || 'gemini-2.0-flash-exp'}`,
      generationConfig: {
        responseModalities: ['AUDIO', 'TEXT'], // Include TEXT for transcription
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: speechConfig.voiceConfig?.prebuiltVoiceConfig?.voiceName || 'Puck'
            }
          }
        }
      }
    }
  };

  // Add system instruction if provided
  if (config.systemInstruction) {
    setupMessage.setup.systemInstruction = {
      parts: [
        {
          text: config.systemInstruction
        }
      ]
    };
  }

  // Add tools (function declarations) if provided
  if (config.tools && config.tools.length > 0) {
    setupMessage.setup.tools = config.tools;
  }

  // Add generation config
  if (config.generationConfig) {
    setupMessage.setup.generationConfig = {
      ...setupMessage.setup.generationConfig,
      ...config.generationConfig
    };
  }

  return setupMessage;
}

/**
 * Build audio input message for Gemini Live API
 * Audio must be base64-encoded PCM16, 16kHz, mono
 */
export function buildGeminiAudioMessage(audioData: ArrayBuffer): any {
  // Convert ArrayBuffer to base64
  const uint8Array = new Uint8Array(audioData);
  const base64Audio = Buffer.from(uint8Array).toString('base64');

  return {
    realtime_input: {
      media_chunks: [
        {
          mime_type: 'audio/pcm',
          data: base64Audio
        }
      ]
    }
  };
}

/**
 * Build function response message for Gemini Live API
 */
export function buildGeminiFunctionResponse(
  functionCallId: string,
  functionName: string,
  response: any
): any {
  return {
    tool_response: {
      function_responses: [
        {
          id: functionCallId,
          name: functionName,
          response
        }
      ]
    }
  };
}

/**
 * Parse Gemini Live API server messages
 */
export interface GeminiServerMessage {
  type: 'setup_complete' | 'audio' | 'transcript' | 'function_call' | 'turn_complete' | 'error';
  data?: any;
}

export function parseGeminiMessage(rawMessage: any): GeminiServerMessage {
  // Setup complete
  if (rawMessage.setupComplete) {
    return {
      type: 'setup_complete'
    };
  }

  // Server content (audio, transcript, function calls)
  if (rawMessage.serverContent) {
    const content = rawMessage.serverContent;

    // Check for model turn (contains audio and/or text)
    if (content.modelTurn) {
      const parts = content.modelTurn.parts || [];

      // Extract audio
      const audioPart = parts.find((p: any) => p.inlineData?.mimeType === 'audio/pcm');
      if (audioPart) {
        return {
          type: 'audio',
          data: {
            audioData: audioPart.inlineData.data, // base64 PCM16, 24kHz
            mimeType: audioPart.inlineData.mimeType
          }
        };
      }

      // Extract text (transcript/response)
      const textPart = parts.find((p: any) => p.text);
      if (textPart) {
        return {
          type: 'transcript',
          data: {
            text: textPart.text
          }
        };
      }
    }

    // Check for function calls
    if (content.functionCalls) {
      return {
        type: 'function_call',
        data: {
          functionCalls: content.functionCalls
        }
      };
    }

    // Turn complete
    if (content.turnComplete !== undefined) {
      return {
        type: 'turn_complete'
      };
    }
  }

  // Tool call (alternative structure)
  if (rawMessage.toolCall) {
    return {
      type: 'function_call',
      data: {
        functionCalls: rawMessage.toolCall.functionCalls || []
      }
    };
  }

  // Error
  if (rawMessage.error) {
    return {
      type: 'error',
      data: rawMessage.error
    };
  }

  // Unknown message type
  console.warn('Unknown Gemini message type:', rawMessage);
  return {
    type: 'error',
    data: { message: 'Unknown message type' }
  };
}

/**
 * Convert OpenAI tool format to Gemini function declarations
 */
export function convertOpenAIToolsToGemini(openAITools: any[]): GeminiTool[] {
  return [
    {
      functionDeclarations: openAITools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.properties,
          required: tool.parameters.required || []
        }
      }))
    }
  ];
}

/**
 * Audio format constants for Gemini Live API
 */
export const GEMINI_AUDIO_CONFIG = {
  INPUT: {
    sampleRate: 16000, // 16kHz
    channels: 1, // Mono
    bitDepth: 16, // PCM16
    encoding: 'pcm16',
    mimeType: 'audio/pcm'
  },
  OUTPUT: {
    sampleRate: 24000, // 24kHz
    channels: 1, // Mono
    bitDepth: 16, // PCM16
    encoding: 'pcm16',
    mimeType: 'audio/pcm'
  }
};

/**
 * Gemini voice options
 * https://ai.google.dev/api/multimodal-live#prebuiltvoiceconfig
 */
export const GEMINI_VOICES = {
  PUCK: 'Puck', // Friendly, warm, male
  CHARON: 'Charon', // Calm, professional, male
  KORE: 'Kore', // Friendly, warm, female
  FENRIR: 'Fenrir', // Deep, authoritative, male
  AOEDE: 'Aoede' // Soft, gentle, female
} as const;

export type GeminiVoiceName = typeof GEMINI_VOICES[keyof typeof GEMINI_VOICES];
