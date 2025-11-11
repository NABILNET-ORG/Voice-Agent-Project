# 🚀 Edge Functions Deployment Guide

## ✅ Database Migration Complete!
All 4 tables created successfully. Now let's deploy the 7 edge functions.

---

## 📍 Deployment URL

Go to: **https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/functions**

---

## 🔧 Deployment Process (For Each Function)

1. Click **"Create a new function"** or **"New Edge Function"**
2. Enter the **function name** (exact name below)
3. Copy the **entire code** from the section below
4. Paste into the code editor
5. Click **"Deploy"**
6. Wait for deployment to complete (green checkmark)

---

## 📋 7 Functions to Deploy

### ☐ 1. twilio-voice ⭐ (MOST IMPORTANT)

**Name:** `twilio-voice`

**Code:** Copy from `supabase/functions/twilio-voice/index.ts`

This is the main webhook that handles incoming phone calls and connects them to OpenAI Realtime API.

---

### ☐ 2. realtime-session

**Name:** `realtime-session`

**Code:** Copy from `supabase/functions/realtime-session/index.ts`

Creates ephemeral tokens for OpenAI Realtime API sessions.

---

### ☐ 3. google-calendar-check

**Name:** `google-calendar-check`

**Code:** Copy from `supabase/functions/google-calendar-check/index.ts`

Checks calendar availability and returns available time slots.

---

### ☐ 4. google-calendar-create

**Name:** `google-calendar-create`

**Code:** Copy from `supabase/functions/google-calendar-create/index.ts`

Creates events in Google Calendar when bookings are made.

---

### ☐ 5. send-sms

**Name:** `send-sms`

**Code:** Copy from `supabase/functions/send-sms/index.ts`

Sends SMS notifications via Twilio.

---

### ☐ 6. send-confirmation-email

**Name:** `send-confirmation-email`

**Code:** Copy from `supabase/functions/send-confirmation-email/index.ts`

Sends booking confirmation emails via Resend.

---

### ☐ 7. send-owner-notification

**Name:** `send-owner-notification`

**Code:** Copy from `supabase/functions/send-owner-notification/index.ts`

Sends notifications to business owner about new bookings.

---

## ⚙️ After Deployment: Configure Secrets

Once all 7 functions are deployed, configure the secrets:

**Go to:** https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/settings/functions

Click **"Add Secret"** for each:

```
OPENAI_API_KEY = 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

TWILIO_ACCOUNT_SID = AC4d821702470b70698ad23e45c9251a93

TWILIO_AUTH_TOKEN = c47a7e6e7b04ca7c47c1b9c9461b5b7a

TWILIO_PHONE_NUMBER = +18108889199
```

Optional (for email notifications):
```
RESEND_API_KEY = (your Resend API key if you have one)
```

---

## 🔴 CRITICAL: Configure Twilio Webhook

**Go to:** https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

1. Click your number: **+1 810-888-9199**
2. Scroll to **"Voice Configuration"**
3. Under **"A CALL COMES IN"**:
   - Select: **Webhook**
   - URL: `https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml`
   - Method: **HTTP POST**
4. Click **Save**

---

## ✅ Verify Deployment

After deploying all functions and configuring secrets:

1. Check that all 7 functions show as "Deployed" (green status)
2. Check that all 4 secrets are configured
3. Test by calling: **+1 (810) 888-9199**

Expected behavior:
- Call connects
- AI answers and greets you
- You can have a conversation
- AI can book appointments

---

## 🎉 Success Criteria

- ✅ All 7 functions deployed
- ✅ All 4 secrets configured
- ✅ Twilio webhook URL saved
- ✅ Phone call connects and AI responds
- ✅ Bookings appear in dashboard (run `npm run dev`)

---

## 🆘 Troubleshooting

**Function deployment fails:**
- Check you copied the entire file content
- Check for any copy-paste formatting issues
- Review function logs in Supabase dashboard

**Phone call doesn't connect:**
- Verify Twilio webhook URL is exact (must end with `/twiml`)
- Check `twilio-voice` function logs for errors
- Verify OPENAI_API_KEY secret is correct

**AI doesn't respond:**
- Check function logs for OpenAI API errors
- Verify OPENAI_API_KEY is valid
- Check Twilio console for call logs

---

## 📞 Next Steps

After successful deployment:

1. Run `npm run dev` in your project folder
2. Open http://localhost:5173
3. Test call your number: +1 (810) 888-9199
4. Check the Bookings page in the dashboard

---

**Estimated Time:** 10-15 minutes for all 7 functions
