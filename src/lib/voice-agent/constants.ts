/**
 * Voice Agent Constants
 *
 * Centralized configuration for voice models, voices, and personalities
 * Used across Settings UI and voice agent implementation
 */

// ============================================
// VOICE MODELS (Provider-specific)
// ============================================

export const VOICE_MODELS = {
  openai: [
    {
      value: 'gpt-4o-realtime-preview-2024-12-17',
      label: 'GPT-4o Realtime (Latest)',
      description: 'Latest realtime model with best quality'
    },
    {
      value: 'gpt-4o-realtime-preview',
      label: 'GPT-4o Realtime (Preview)',
      description: 'Preview version'
    }
  ],
  gemini: [
    {
      value: 'gemini-2.0-flash-exp',
      label: 'Gemini 2.0 Flash (Experimental)',
      description: 'Best for real-time voice, lowest cost'
    },
    {
      value: 'gemini-exp-1206',
      label: 'Gemini Experimental 12/06',
      description: 'Latest experimental model'
    },
    {
      value: 'gemini-2.0-flash-thinking-exp-1219',
      label: 'Gemini 2.0 Flash Thinking',
      description: 'With enhanced reasoning (slower)'
    }
  ],
  openrouter: [
    {
      value: 'anthropic/claude-3-5-sonnet',
      label: 'Claude 3.5 Sonnet',
      description: 'Via OpenRouter (if supported)'
    }
  ]
} as const;

// ============================================
// VOICE NAMES (Provider-specific)
// ============================================

export const VOICE_NAMES = {
  openai: [
    { value: 'alloy', label: 'Alloy', description: 'Neutral, balanced' },
    { value: 'echo', label: 'Echo', description: 'Warm, friendly' },
    { value: 'fable', label: 'Fable', description: 'Upbeat, energetic' },
    { value: 'onyx', label: 'Onyx', description: 'Deep, authoritative' },
    { value: 'nova', label: 'Nova', description: 'Energetic, dynamic' },
    { value: 'shimmer', label: 'Shimmer', description: 'Soft, gentle' }
  ],
  gemini: [
    { value: 'Puck', label: 'Puck', description: 'Friendly, warm, male' },
    { value: 'Charon', label: 'Charon', description: 'Calm, professional, male' },
    { value: 'Kore', label: 'Kore', description: 'Friendly, warm, female' },
    { value: 'Fenrir', label: 'Fenrir', description: 'Deep, authoritative, male' },
    { value: 'Aoede', label: 'Aoede', description: 'Soft, gentle, female' }
  ],
  openrouter: [] // TBD based on model
} as const;

// ============================================
// VOICE PERSONALITIES
// ============================================

export const VOICE_PERSONALITIES = [
  {
    value: 'Friendly - Warm, approachable, conversational',
    label: 'Friendly',
    description: 'Warm, approachable, conversational',
    systemPrompt: 'You are a friendly and warm AI assistant. Speak in a conversational, approachable manner. Be helpful and enthusiastic while maintaining professionalism.'
  },
  {
    value: 'Professional - Business-like, formal, efficient',
    label: 'Professional',
    description: 'Business-like, formal, efficient',
    systemPrompt: 'You are a professional business assistant. Speak clearly and efficiently. Be polite, formal, and focused on helping customers complete their tasks quickly.'
  },
  {
    value: 'Empathetic - Understanding, supportive, caring',
    label: 'Empathetic',
    description: 'Understanding, supportive, caring',
    systemPrompt: 'You are an empathetic and caring AI assistant. Listen carefully and respond with understanding and compassion. Make customers feel heard and supported.'
  },
  {
    value: 'Energetic - Upbeat, enthusiastic, dynamic',
    label: 'Energetic',
    description: 'Upbeat, enthusiastic, dynamic',
    systemPrompt: 'You are an energetic and enthusiastic AI assistant. Speak with energy and excitement. Be upbeat and positive while helping customers.'
  },
  {
    value: 'Concise - Brief, to-the-point, no-nonsense',
    label: 'Concise',
    description: 'Brief, to-the-point, no-nonsense',
    systemPrompt: 'You are a concise and efficient AI assistant. Give brief, direct answers. Focus on essential information only. No small talk unless requested.'
  }
] as const;

// ============================================
// PROVIDER INFORMATION
// ============================================

export const VOICE_PROVIDERS = [
  {
    value: 'gemini',
    label: 'Google Gemini',
    costPerMinute: 0.016,
    description: '19x cheaper than OpenAI, high quality',
    recommended: true,
    features: ['Real-time voice', 'Function calling', 'Low latency', 'Cost-effective']
  },
  {
    value: 'openai',
    label: 'OpenAI',
    costPerMinute: 0.30,
    description: 'Premium quality, lowest latency',
    recommended: false,
    features: ['Premium quality', 'Lowest latency', 'WebRTC support', 'Best accuracy']
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    costPerMinute: 0.10, // Estimate
    description: 'Access multiple models via one API',
    recommended: false,
    features: ['Multiple models', 'Flexible pricing', 'Model switching']
  }
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getModelsForProvider(provider: 'openai' | 'gemini' | 'openrouter') {
  return VOICE_MODELS[provider] || [];
}

export function getVoicesForProvider(provider: 'openai' | 'gemini' | 'openrouter') {
  return VOICE_NAMES[provider] || [];
}

export function getProviderInfo(provider: 'openai' | 'gemini' | 'openrouter') {
  return VOICE_PROVIDERS.find(p => p.value === provider);
}

export function validateVoiceForProvider(voice: string, provider: 'openai' | 'gemini' | 'openrouter'): boolean {
  const voices = getVoicesForProvider(provider);
  return voices.some(v => v.value === voice);
}

export function getDefaultVoiceForProvider(provider: 'openai' | 'gemini' | 'openrouter'): string {
  const voices = getVoicesForProvider(provider);
  return voices[0]?.value || 'alloy';
}

export function getDefaultModelForProvider(provider: 'openai' | 'gemini' | 'openrouter'): string {
  const models = getModelsForProvider(provider);
  return models[0]?.value || 'gemini-2.0-flash-exp';
}

// ============================================
// TYPE EXPORTS
// ============================================

export type VoiceProvider = 'openai' | 'gemini' | 'openrouter';
export type VoiceModel = typeof VOICE_MODELS[VoiceProvider][number]['value'];
export type VoiceName = typeof VOICE_NAMES[VoiceProvider][number]['value'];
export type VoicePersonality = typeof VOICE_PERSONALITIES[number]['value'];
