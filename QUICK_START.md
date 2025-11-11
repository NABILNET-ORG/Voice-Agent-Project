# ⚡ Quick Start Guide

## 🎯 Your System Details

**Twilio Phone Number:** `+1 (810) 888-9199`
**Call this number to test your AI assistant!**

**Webhook URL (Configure in Twilio):**
```
https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml
```

**Supabase Dashboard:**
https://supabase.com/dashboard/project/hixuvycqekjxbplddykt

**Local Dashboard:**
http://localhost:5173

---

## 🚀 3-Minute Setup

### 1. Deploy Database (2 minutes)

Go to: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/editor

Click **SQL Editor** → **New Query**

Copy & paste contents from: `supabase/migrations/20250111_initial_schema.sql`

Click **Run** ✅

### 2. Deploy Functions (Manual - via Dashboard)

Go to: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/functions

For each function below, click **Create Function**, copy code, deploy:

1. `realtime-session` ← from `supabase/functions/realtime-session/index.ts`
2. `send-sms` ← from `supabase/functions/send-sms/index.ts`
3. `send-confirmation-email` ← from `supabase/functions/send-confirmation-email/index.ts`
4. `send-owner-notification` ← from `supabase/functions/send-owner-notification/index.ts`
5. `google-calendar-check` ← from `supabase/functions/google-calendar-check/index.ts`
6. `google-calendar-create` ← from `supabase/functions/google-calendar-create/index.ts`
7. `twilio-voice` ⭐ ← from `supabase/functions/twilio-voice/index.ts`

### 3. Configure Secrets

Go to: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/settings/functions

Add these 4 secrets (click **Add Secret** for each):

| Secret Name | Secret Value |
|------------|--------------|
| `OPENAI_API_KEY` | `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` |
| `TWILIO_ACCOUNT_SID` | `AC4d821702470b70698ad23e45c9251a93` |
| `TWILIO_AUTH_TOKEN` | `c47a7e6e7b04ca7c47c1b9c9461b5b7a` |
| `TWILIO_PHONE_NUMBER` | `+18108889199` |

### 4. 🔴 CONFIGURE TWILIO WEBHOOK (CRITICAL!)

Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

Click your number: **+1 810-888-9199**

Under "Voice Configuration" → "A CALL COMES IN":
- Select: **Webhook**
- URL: `https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml`
- Method: **HTTP POST**

Click **Save** ✅

### 5. Run the App

```bash
npm install
npm run dev
```

Open: http://localhost:5173

---

## 📞 TEST IT NOW!

**Call: +1 (810) 888-9199**

Say: "I'd like to book a haircut for tomorrow at 2 PM"

Then check the **Bookings** page in the dashboard!

---

## 📊 Monitor Your System

**Edge Function Logs:**
https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/functions

**Database Tables:**
https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/editor

**Twilio Call Logs:**
https://console.twilio.com/us1/monitor/logs/calls

---

## ⚙️ Customize Your Business

1. Go to **Business Settings** in the sidebar
2. Update:
   - Business name, type, description
   - Services and pricing
   - Business hours
   - AI voice and personality
   - Custom instructions
3. Click **Save Changes**

---

## 🆘 Quick Fixes

**Calls not working?**
- Check Twilio webhook URL is configured
- Verify Edge Function secrets are set
- Check function logs for errors

**Bookings not showing?**
- Verify .env file has correct Supabase URL/key
- Check browser console for errors
- Make sure database migration ran successfully

**AI not responding?**
- Verify OpenAI API key is valid
- Check if you have Realtime API access
- View twilio-voice function logs

---

## 📚 Full Documentation

- **Complete Setup:** `DEPLOYMENT_GUIDE.md`
- **Project Overview:** `README.md`
- **Deploy Script:** `./deploy-functions.sh` (if CLI is available)

---

**You're all set! 🎉**

Your AI booking assistant is ready to take calls!
