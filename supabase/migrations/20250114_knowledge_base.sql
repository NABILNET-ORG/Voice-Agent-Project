-- Knowledge Base for AI Voice Agent
-- Stores website content and other knowledge sources for AI context

-- Create knowledge_sources table
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source information
  source_type TEXT NOT NULL DEFAULT 'website', -- 'website', 'pdf', 'manual', 'document'
  url TEXT,
  title TEXT NOT NULL,

  -- Content
  content TEXT, -- Full content in markdown format
  summary TEXT, -- AI-generated summary for token efficiency

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- {word_count, page_count, fetch_date, crawl_depth, etc}

  -- Settings
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=lowest, 5=highest
  is_active BOOLEAN DEFAULT true,
  auto_update BOOLEAN DEFAULT false,

  -- Timestamps
  last_fetched_at TIMESTAMPTZ,
  next_fetch_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own knowledge sources" ON knowledge_sources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge sources" ON knowledge_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge sources" ON knowledge_sources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge sources" ON knowledge_sources
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_knowledge_sources_user_id ON knowledge_sources(user_id);
CREATE INDEX idx_knowledge_sources_active ON knowledge_sources(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_knowledge_sources_priority ON knowledge_sources(user_id, priority DESC);

-- Add AI model selection fields to business_config
ALTER TABLE business_config ADD COLUMN IF NOT EXISTS ai_model_provider TEXT DEFAULT 'openai' CHECK (ai_model_provider IN ('openai', 'gemini', 'openrouter'));
ALTER TABLE business_config ADD COLUMN IF NOT EXISTS ai_model_name TEXT DEFAULT 'gpt-4o-realtime-preview-2024-12-17';
ALTER TABLE business_config ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE business_config ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT;

-- Update timestamp trigger for knowledge_sources
CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE knowledge_sources IS 'Stores website content and knowledge sources for AI voice agent context';
COMMENT ON COLUMN knowledge_sources.priority IS 'Priority 1-5, higher priority content is loaded first into AI context';
COMMENT ON COLUMN knowledge_sources.summary IS 'AI-generated summary for token-efficient context injection';
COMMENT ON COLUMN business_config.ai_model_provider IS 'AI provider: openai, gemini, or openrouter';
COMMENT ON COLUMN business_config.ai_model_name IS 'Specific model name to use for voice calls';
