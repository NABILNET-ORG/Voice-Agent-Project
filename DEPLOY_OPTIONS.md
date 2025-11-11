# 🚀 Edge Functions Deployment - 3 Options

You can deploy the 7 edge functions using any of these methods:

---

## ⚡ Option 1: CLI (Recommended - Fastest!)

**Time: 2 minutes** | **Easiest and most reliable**

### Step 1: Install Supabase CLI

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Alternative (npm):**
```bash
npm install -g supabase
```

More info: https://supabase.com/docs/guides/cli/getting-started

### Step 2: Run the Deploy Script

**On your local machine**, navigate to the project folder and run:

```bash
./deploy-all-functions.sh
```

**Or manually:**

```bash
# Link to your project
supabase link --project-ref hixuvycqekjxbplddykt

# Deploy all functions
supabase functions deploy twilio-voice
supabase functions deploy realtime-session
supabase functions deploy google-calendar-check
supabase functions deploy google-calendar-create
supabase functions deploy send-sms
supabase functions deploy send-confirmation-email
supabase functions deploy send-owner-notification

# Set secrets
supabase secrets set OPENAI_API_KEY="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"
supabase secrets set TWILIO_ACCOUNT_SID="AC4d821702470b70698ad23e45c9251a93"
supabase secrets set TWILIO_AUTH_TOKEN="c47a7e6e7b04ca7c47c1b9c9461b5b7a"
supabase secrets set TWILIO_PHONE_NUMBER="+18108889199"
```

**Done!** ✅ All functions deployed in seconds.

---

## 📝 Option 2: Dashboard Editor (Manual)

**Time: 10-15 minutes** | **No installation required**

### Steps:

1. **Go to:** https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/functions

2. **For each function:**
   - Click **"Create a new function"**
   - Enter function name (see list below)
   - Copy entire file contents
   - Paste into editor
   - Click **"Deploy"**

### Function List:

| Function Name | File Path |
|---------------|-----------|
| `twilio-voice` | `supabase/functions/twilio-voice/index.ts` |
| `realtime-session` | `supabase/functions/realtime-session/index.ts` |
| `google-calendar-check` | `supabase/functions/google-calendar-check/index.ts` |
| `google-calendar-create` | `supabase/functions/google-calendar-create/index.ts` |
| `send-sms` | `supabase/functions/send-sms/index.ts` |
| `send-confirmation-email` | `supabase/functions/send-confirmation-email/index.ts` |
| `send-owner-notification` | `supabase/functions/send-owner-notification/index.ts` |

3. **Configure secrets:**
   - Go to: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/settings/functions
   - Click "Add Secret" for each:
     - `OPENAI_API_KEY`
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`
     - `TWILIO_PHONE_NUMBER`

---

## 🤖 Option 3: AI Assistant (If Available)

**Time: 1 minute** | **Requires Supabase AI features**

If your Supabase dashboard has AI assistant features:

1. Open Supabase Functions page
2. Look for "Deploy with AI" or AI assistant
3. Provide function names and code
4. Let AI deploy automatically

**Note:** This feature may not be available on all Supabase plans.

---

## 📊 Comparison

| Method | Time | Pros | Cons |
|--------|------|------|------|
| **CLI** ⭐ | 2 min | Fast, reliable, automated | Requires CLI installation |
| **Editor** | 10-15 min | No installation needed | Manual, time-consuming |
| **AI** | 1 min | Fastest if available | May not be available |

---

## ✅ After Deployment

**No matter which method you use, you MUST:**

### 1. Configure Twilio Webhook

**Go to:** https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

- Click number: **+1 810-888-9199**
- Under "Voice Configuration" → "A CALL COMES IN":
  - Select: **Webhook**
  - URL: `https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml`
  - Method: **HTTP POST**
- Click **Save**

### 2. Test It

Call: **+1 (810) 888-9199**

Say: *"I'd like to book a haircut for tomorrow at 2 PM"*

---

## 🆘 Troubleshooting

**CLI says "not linked":**
```bash
supabase link --project-ref hixuvycqekjxbplddykt
```

**CLI asks for access token:**
- Get it from: https://supabase.com/dashboard/account/tokens
- Create new token: "Deploy Functions"
- Paste when prompted

**Function deployment fails:**
- Check function name is exact (lowercase, hyphens)
- Verify file paths are correct
- Check code has no syntax errors

**Phone doesn't connect:**
- Verify Twilio webhook URL is exact
- Check function logs in Supabase dashboard
- Verify secrets are configured

---

## 🎯 Recommended Approach

**I recommend Option 1 (CLI)** because:
- ✅ Deploys all 7 functions in seconds
- ✅ Automatically sets all secrets
- ✅ Less error-prone than manual copy-paste
- ✅ Reusable if you make changes

Just run:
```bash
./deploy-all-functions.sh
```

Done! 🚀
