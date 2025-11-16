# Debugging Voice Agent Token Endpoint

## Problem Statement

The `/api/voice-agent/token` endpoint returns **404 Not Found** when called from the frontend.

```
POST http://localhost:3000/api/voice-agent/token 404 (Not Found)
```

## Investigation Steps

### 1. File Structure ✅ VERIFIED
```bash
src/app/api/voice-agent/token/route.ts EXISTS
```

The file exists in the correct location.

### 2. Build Status ✅ SUCCESS
```bash
npm run build
# ✓ Compiled successfully
# ├ ƒ /api/voice-agent/token    225 B    102 kB
```

The endpoint compiles successfully with no TypeScript errors.

### 3. Route Export ✅ CORRECT
```typescript
export async function POST(request: NextRequest) {
  // Implementation
}
```

The route exports a POST handler correctly.

### 4. Supabase Client Pattern ✅ CORRECT
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient(); // New async pattern
```

Uses the **correct new pattern** (`@/lib/supabase/server`) vs old pattern (`@/lib/supabase`).

## Root Cause Analysis

The 404 error is **NOT** a Next.js routing error. The issue is that the endpoint is **returning a 404 HTTP status code** from within the route handler, not a "file not found" error.

### Possible Causes

1. **Business Config Not Found** (line 42-66)
   ```typescript
   if (configError || !config) {
     return NextResponse.json(
       { error: 'Business configuration not found' },
       { status: 404 } // <-- THIS 404!
     );
   }
   ```

2. **API Key Missing** (line 88-103)
   ```typescript
   if (!apiKey) {
     return NextResponse.json(
       { error: `${provider.toUpperCase()} API key not configured` },
       { status: 400 } // 400, not 404
     );
   }
   ```

3. **Context Fetch Failure** (line 105-124)
   - The context endpoint might be failing
   - This would cause the token endpoint to use default instructions
   - But shouldn't cause a 404

## Debugging Logs Added

Added comprehensive console logging at every step:

1. ✅ Request received
2. ✅ Auth check
3. ✅ Config query result
4. ✅ Provider selection
5. ✅ API key check
6. ✅ Context fetch
7. ✅ Provider-specific session creation
8. ✅ Final response

## Expected Console Output

When the endpoint is called, you should see:

```
[Voice Agent Token] Request received
[Voice Agent Token] Auth check: { hasUser: true, authError: undefined }
[Voice Agent Token] Fetching business config for user: b2721f19-331a-4eb8-8c3d-184153e42faf
[Voice Agent Token] Config query result: { hasConfig: true, configError: undefined, provider: 'gemini' }
[Voice Agent Token] Provider selected: gemini
[Voice Agent Token] Gemini key check: { hasEnvKey: false, hasDbKey: false }
[Voice Agent Token] No API key found for provider: gemini
```

## Hypothesis

**Most Likely**: The endpoint is returning 404 because **business_config is not found** for the authenticated user.

**Reason**: New Gemini-specific columns (`gemini_api_key`, `ai_voice_agent_provider`) exist in the schema but might not have data.

## Next Steps

1. ✅ Start dev server with logging
2. ✅ Call endpoint from frontend
3. ✅ Check console logs
4. ✅ Identify which condition is triggering the 404
5. ⏳ Fix the root cause (likely missing API key or config)

## Testing Commands

```bash
# Start dev server
npm run dev

# In browser console, call the endpoint
fetch('/api/voice-agent/token', {
  method: 'POST'
}).then(r => r.json()).then(console.log)

# Check server logs in terminal
```

## Supabase Client Patterns

### Old Pattern (context endpoint)
```typescript
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

const cookieStore = await cookies();
const supabase = createClient(cookieStore);
```

### New Pattern (token endpoint) ✅ CORRECT
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient(); // Handles cookies internally
```

## Database Schema Check

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'business_config'
AND column_name IN (
  'gemini_api_key',
  'ai_voice_agent_provider',
  'openai_api_key'
);
```

✅ **Result**: All columns exist

## Data Check

```sql
-- Check if user has business config
SELECT
  user_id,
  business_name,
  ai_voice_agent_provider,
  CASE
    WHEN gemini_api_key IS NULL THEN 'NOT SET'
    ELSE 'SET'
  END as gemini_key_status,
  CASE
    WHEN openai_api_key IS NULL THEN 'NOT SET'
    ELSE 'SET'
  END as openai_key_status
FROM business_config
WHERE user_id = 'b2721f19-331a-4eb8-8c3d-184153e42faf';
```

Expected result:
```
user_id: b2721f19-331a-4eb8-8c3d-184153e42faf
business_name: Samia Tarot
ai_voice_agent_provider: NULL
gemini_key_status: NOT SET
openai_key_status: NOT SET
```

## Solution

**Immediate Fix**: Set a default API key or return a better error message

**Option 1**: Use environment variable fallback
```bash
# Add to .env.local
GEMINI_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
```

**Option 2**: Add API key via Settings UI
- Navigate to Settings → AI Integrations
- Add Gemini API Key
- Or add OpenAI API Key

**Option 3**: Modify default provider
```sql
-- Set default provider to OpenAI if you have that key
UPDATE business_config
SET ai_voice_agent_provider = 'openai'
WHERE user_id = 'b2721f19-331a-4eb8-8c3d-184153e42faf';
```

## Error Response Format

The endpoint returns detailed debug info in development:

```json
{
  "error": "GEMINI API key not configured",
  "message": "Please add your GEMINI API key in Settings > AI Integrations or set GEMINI_API_KEY environment variable",
  "provider": "gemini",
  "debug": {
    "provider": "gemini",
    "hasEnvKey": false,
    "hasDbKey": false
  }
}
```

## Resolution

Once logs are reviewed, the fix will be one of:

1. Add API key to database via Settings UI
2. Add API key to environment variables
3. Change provider to one that has a key configured
4. Improve error messaging to guide users better

---

**Last Updated**: November 16, 2025
**Status**: Debugging in progress
**Next**: Review console logs from dev server
