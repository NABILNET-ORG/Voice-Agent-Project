-- Migration: Voice Agent Architecture Refactor
-- Date: 2025-11-16
-- Purpose: Separate voice agent configuration from general AI configuration
-- Changes:
--   1. Dual API keys per provider (general vs voice)
--   2. Dedicated voice agent configuration columns
--   3. Remove voice agent from general AI provider selection

-- ============================================
-- STEP 1: Add dual API key columns
-- ============================================

-- OpenAI: Separate keys for general AI and voice agent
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS openai_api_key_general TEXT,
ADD COLUMN IF NOT EXISTS openai_api_key_voice TEXT;

-- Gemini: Separate keys for general AI and voice agent
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS gemini_api_key_general TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_key_voice TEXT;

-- OpenRouter: Separate keys for general AI and voice agent
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS openrouter_api_key_general TEXT,
ADD COLUMN IF NOT EXISTS openrouter_api_key_voice TEXT;

-- ============================================
-- STEP 2: Migrate existing data
-- ============================================

-- Migrate existing OpenAI keys to general (users can add voice separately)
UPDATE business_config
SET openai_api_key_general = openai_api_key
WHERE openai_api_key IS NOT NULL AND openai_api_key_general IS NULL;

-- Migrate existing Gemini keys to general
UPDATE business_config
SET gemini_api_key_general = gemini_api_key
WHERE gemini_api_key IS NOT NULL AND gemini_api_key_general IS NULL;

-- Migrate existing OpenRouter keys to general
UPDATE business_config
SET openrouter_api_key_general = openrouter_api_key
WHERE openrouter_api_key IS NOT NULL AND openrouter_api_key_general IS NULL;

-- ============================================
-- STEP 3: Add voice agent configuration columns
-- ============================================

ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS voice_agent_provider TEXT DEFAULT 'gemini',
ADD COLUMN IF NOT EXISTS voice_agent_model TEXT,
ADD COLUMN IF NOT EXISTS voice_agent_voice_name TEXT,
ADD COLUMN IF NOT EXISTS voice_agent_personality TEXT DEFAULT 'Friendly - Warm, approachable, conversational';

-- ============================================
-- STEP 4: Migrate existing voice configuration
-- ============================================

-- Migrate ai_voice_agent_provider to voice_agent_provider
UPDATE business_config
SET voice_agent_provider = ai_voice_agent_provider
WHERE ai_voice_agent_provider IS NOT NULL;

-- Set default voice based on current ai_voice (if compatible)
UPDATE business_config
SET voice_agent_voice_name = CASE
  WHEN ai_voice IN ('Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede') THEN ai_voice
  WHEN ai_voice IN ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer') THEN ai_voice
  ELSE 'Puck'
END
WHERE voice_agent_voice_name IS NULL;

-- Set default model based on provider
UPDATE business_config
SET voice_agent_model = CASE
  WHEN voice_agent_provider = 'openai' THEN 'gpt-4o-realtime-preview-2024-12-17'
  WHEN voice_agent_provider = 'gemini' THEN 'gemini-2.0-flash-exp'
  ELSE 'gemini-2.0-flash-exp'
END
WHERE voice_agent_model IS NULL;

-- ============================================
-- STEP 5: Add comments for documentation
-- ============================================

COMMENT ON COLUMN business_config.openai_api_key_general IS 'OpenAI API key for general AI features (summarization, analytics, transcription)';
COMMENT ON COLUMN business_config.openai_api_key_voice IS 'OpenAI API key for voice agent (Realtime API)';
COMMENT ON COLUMN business_config.gemini_api_key_general IS 'Gemini API key for general AI features (summarization, analytics)';
COMMENT ON COLUMN business_config.gemini_api_key_voice IS 'Gemini API key for voice agent (Gemini Live API)';
COMMENT ON COLUMN business_config.openrouter_api_key_general IS 'OpenRouter API key for general AI features';
COMMENT ON COLUMN business_config.openrouter_api_key_voice IS 'OpenRouter API key for voice agent';

COMMENT ON COLUMN business_config.voice_agent_provider IS 'Voice agent provider: openai, gemini, or openrouter';
COMMENT ON COLUMN business_config.voice_agent_model IS 'Voice agent model name (provider-specific)';
COMMENT ON COLUMN business_config.voice_agent_voice_name IS 'Voice name for speech synthesis (provider-specific)';
COMMENT ON COLUMN business_config.voice_agent_personality IS 'Voice agent personality/tone description';

-- ============================================
-- STEP 6: Add validation constraints (optional)
-- ============================================

-- Ensure voice_agent_provider is valid
ALTER TABLE business_config
ADD CONSTRAINT voice_agent_provider_check
CHECK (voice_agent_provider IN ('openai', 'gemini', 'openrouter') OR voice_agent_provider IS NULL);

-- ============================================
-- NOTES
-- ============================================

-- Old columns (deprecated but kept for backward compatibility):
-- - openai_api_key (use openai_api_key_general instead)
-- - gemini_api_key (use gemini_api_key_general instead)
-- - openrouter_api_key (use openrouter_api_key_general instead)
-- - ai_voice_agent_provider (use voice_agent_provider instead)
-- - ai_voice (use voice_agent_voice_name instead)

-- Migration complete
-- Users can now:
-- 1. Configure dual API keys per provider (Integrations page)
-- 2. Configure voice agent separately (AI Assistant Configuration page)
-- 3. Use different models/voices for voice vs text AI
