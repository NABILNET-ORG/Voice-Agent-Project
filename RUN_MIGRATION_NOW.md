# ⚠️ IMMEDIATE ACTION REQUIRED: Run Database Migration

## Quick Start (2 minutes)

The database migration could not be executed automatically due to network connectivity issues.
**You need to run it manually via Supabase Dashboard.**

### Step-by-Step Instructions

#### 1. Open Supabase Dashboard
**Click this link:** https://hixuvycqekjxbplddykt.supabase.co

#### 2. Navigate to SQL Editor
- In the left sidebar, click **"SQL Editor"**
- Click **"New Query"** button

#### 3. Copy the Migration SQL
Open this file: `supabase/migrations/20250114_knowledge_base.sql`

Or copy this complete SQL:

```sql
-- Knowledge Base for AI Voice Agent
-- Stores website content and other knowledge sources for AI context

-- Create knowledge_sources table
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source information
  source_type TEXT NOT NULL DEFAULT 'website',
  url TEXT,
  title TEXT NOT NULL,

  -- Content
  content TEXT,
  summary TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Settings
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
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
```

#### 4. Paste and Run
- Paste the SQL into the editor
- Click **"Run"** button (or press `Ctrl+Enter`)
- Wait for "Success" message

#### 5. Verify
Run this verification query in a new SQL Editor tab:

```sql
-- Check if table exists
SELECT * FROM knowledge_sources LIMIT 1;

-- Check if columns were added
SELECT ai_model_provider, ai_model_name
FROM business_config
LIMIT 1;
```

If both queries work without errors, ✅ **migration successful**!

---

## What This Migration Does

### Creates `knowledge_sources` Table
Stores AI knowledge sources for contextual responses:
- Website content (up to 20 sources)
- AI-generated summaries
- Priority system for context loading
- Auto-update capability
- Full RLS security

### Adds AI Model Configuration
Extends `business_config` table with:
- `ai_model_provider` - Choose between OpenAI, Gemini, OpenRouter
- `ai_model_name` - Specific model identifier
- `gemini_api_key` - For Google Gemini integration
- `openrouter_api_key` - For OpenRouter integration

---

## Why Manual Execution Was Needed

Attempted automatic migration methods:
- ❌ Direct psql connection - DNS resolution failed
- ❌ Node.js pg client - Network unreachable
- ❌ Supabase REST API - RPC not available
- ❌ Connection pooler - Authentication failed

**Root cause:** Network connectivity issues from current environment (likely IPv6, firewall, or DNS restrictions)

---

## After Migration

Once complete, you can:
1. ✅ Test Knowledge Base feature in Settings → AI Configuration
2. ✅ Add website sources for AI context
3. ✅ Configure AI model provider (OpenAI/Gemini/OpenRouter)
4. ✅ Run TestSprite test TC015 (Knowledge Base testing)

---

## Need Help?

If you encounter any errors:
1. Check that you're logged into the correct Supabase project
2. Verify you have admin/owner permissions
3. Try running each CREATE statement individually
4. Check error messages for details

---

**Estimated Time:** 2-3 minutes
**Complexity:** Low (copy & paste)
**Impact:** Unlocks Knowledge Base feature and AI model selection
