# Database Migration Guide

## Step 1: Run Knowledge Base Migration

### Option A: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Visit: https://hixuvycqekjxbplddykt.supabase.co
   - Login with your Supabase account

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste the Migration SQL**
   - Open file: [`supabase/migrations/20250114_knowledge_base.sql`](supabase/migrations/20250114_knowledge_base.sql)
   - Copy entire contents
   - Paste into SQL Editor

4. **Execute the Migration**
   - Click "Run" or press `Ctrl+Enter`
   - Wait for success message
   - Verify no errors in output

### Option B: Via Supabase CLI (Alternative)

```bash
# 1. Login to Supabase
supabase login

# 2. Link to project
supabase link --project-ref hixuvycqekjxbplddykt

# 3. Push migration
supabase db push

# OR apply specific migration
supabase db reset
```

### Option C: Via Direct Database Connection (Advanced)

If you have database credentials with direct access:

```bash
psql "postgresql://postgres:[password]@db.hixuvycqekjxbplddykt.supabase.co:5432/postgres" \
  -f supabase/migrations/20250114_knowledge_base.sql
```

## What This Migration Does

### Creates `knowledge_sources` Table
- Stores website content, PDFs, and manual knowledge entries
- Full text content + AI-generated summaries
- Priority system (1-5) for context loading
- Auto-update capability for website sources
- Row Level Security enabled (users see only their own sources)

### Adds AI Model Fields to `business_config`
- `ai_model_provider` - openai | gemini | openrouter
- `ai_model_name` - specific model identifier
- `gemini_api_key` - for Gemini integration
- `openrouter_api_key` - for OpenRouter integration

## Verification

After running the migration, verify it worked:

### Check Tables Exist
```sql
-- In Supabase SQL Editor
SELECT * FROM knowledge_sources LIMIT 1;
SELECT ai_model_provider, ai_model_name FROM business_config LIMIT 1;
```

### Via Application
1. Start the dev server: `npm run dev`
2. Navigate to: Settings ’ AI Configuration ’ Knowledge Base
3. Try adding a website source
4. If no errors appear, migration succeeded!

## Troubleshooting

### Error: "relation knowledge_sources does not exist"
- Migration hasn't run yet
- Follow Option A (Supabase Dashboard) above

### Error: "column ai_model_provider does not exist"
- ALTER TABLE statements didn't execute
- Check if business_config table exists first
- Re-run migration

### Permission Denied Errors
- Ensure you're logged in with admin/owner access
- Service role key in `.env` is correct
- RLS policies may be blocking - use Dashboard with admin privileges

## Next Steps

After successful migration:
1.  Test Knowledge Base feature in Settings
2. Add Google OAuth test user (see NEXT_ACTIONS.md step 2)
3. Configure AI model provider
