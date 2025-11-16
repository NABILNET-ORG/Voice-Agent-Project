# Quick Fix Guide: Voice Agent 404 Error

## Problem
The voice agent returns 404 because no API key is configured for Gemini (the default provider).

## Solution: Add Gemini API Key via Settings UI

### Step 1: Get a Free Gemini API Key

1. Go to **https://aistudio.google.com/apikey**
2. Click "Create API Key"
3. Select a Google Cloud project (or create a new one)
4. Copy the API key (starts with `AIza...`)

**Cost**: FREE for Gemini API! First 1500 requests/day are free.

### Step 2: Add the Key via Settings UI

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Navigate to Settings**:
   ```
   http://localhost:3000/settings/integrations
   ```

3. **Find the "Google Gemini" card**

4. **Click "Configure"**

5. **Fill in the form**:
   - **API Key**: Paste your Gemini API key (from Step 1)
   - **Model Name**: Leave default or use `gemini-2.0-flash-live-001`
   - **Use for Voice Agent**: ✅ **Check this box!** (Important!)
   - **Use for Summarization**: Optional
   - **Use for Analytics**: Optional

6. **Click "Save"**

7. **Refresh the page** to see "Connected" status

### Step 3: Test the Voice Agent

1. **Navigate to the home page**:
   ```
   http://localhost:3000/
   ```

2. **Click "Start Demo Call"**

3. **You should see in the terminal**:
   ```
   [Voice Agent Token] Request received
   [Voice Agent Token] Auth check: { hasUser: true, authError: undefined }
   [Voice Agent Token] Fetching business config for user: ...
   [Voice Agent Token] Config query result: { hasConfig: true, configError: undefined, provider: 'gemini' }
   [Voice Agent Token] Provider selected: gemini
   [Voice Agent Token] Gemini key check: { hasEnvKey: false, hasDbKey: true }
   [Voice Agent Token] Creating session for provider: gemini
   [Voice Agent Token] Creating Gemini session...
   [Voice Agent Token] Gemini session created, returning credentials
   ```

4. **Success!** The voice agent should now connect successfully

---

## Alternative: Use OpenAI Instead (If you already have an OpenAI key)

### If you prefer OpenAI Realtime API:

1. **Get OpenAI API Key**: https://platform.openai.com/api-keys

2. **Navigate to Settings → Integrations**

3. **Find "OpenAI" card → Configure**

4. **Fill in**:
   - **API Key**: Your OpenAI key (starts with `sk-...`)
   - **Model**: `gpt-4o-realtime-preview-2024-12-17`
   - **Use for Voice Agent**: ✅ **Check this box!**

5. **Save**

**Note**: OpenAI is **19x more expensive** ($0.30/min vs $0.016/min for Gemini)

---

## Troubleshooting

### Still getting 404?

Check the terminal logs to see where it's failing:

1. **Config not found?**
   ```
   [Voice Agent Token] Config error: ...
   ```
   → Make sure you have a business_config record in the database

2. **API key still missing?**
   ```
   [Voice Agent Token] Gemini key check: { hasEnvKey: false, hasDbKey: false }
   ```
   → The "Use for Voice Agent" checkbox was not checked. Go back and check it!

3. **Different error?**
   → Share the terminal output and we'll debug further

### Verify API Key is Saved

Run this query in your Supabase dashboard:

```sql
SELECT
  business_name,
  ai_voice_agent_provider,
  CASE
    WHEN gemini_api_key IS NULL THEN 'NOT SET'
    ELSE 'SET (' || LENGTH(gemini_api_key) || ' chars)'
  END as gemini_key_status
FROM business_config
WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
```

Expected result:
```
business_name: Samia Tarot
ai_voice_agent_provider: gemini
gemini_key_status: SET (39 chars)
```

---

## Cost Comparison

| Provider | Setup | Cost/min | Monthly (100 min) |
|----------|-------|----------|-------------------|
| **Gemini** | FREE API key | $0.016 | $1.60 |
| OpenAI | Paid API key | $0.30 | $30.00 |

**Savings with Gemini: 94.7%**

---

## Next Steps After Fixing

Once the voice agent is working:

1. **Test voice quality** - Speak with the agent
2. **Test function calling** - Ask it to book an appointment
3. **Compare latency** - Check response time
4. **Deploy to production** - `vercel --prod`

---

**Last Updated**: November 16, 2025
**Estimated Time**: 5 minutes
**Difficulty**: Easy
