# 🚀 Deployment Guide - Universal AI Booking System

This guide will help you deploy your system step by step using the credentials you provided.

## 📋 Your Credentials

```
Supabase URL: https://hixuvycqekjxbplddykt.supabase.co
Project Ref: hixuvycqekjxbplddykt

Twilio:
- Account SID: AC4d821702470b70698ad23e45c9251a93
- Auth Token: c47a7e6e7b04ca7c47c1b9c9461b5b7a
- Phone Number: +18108889199

OpenAI API Key: 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
```

## Step 1: Deploy Database Schema ✅

### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/hixuvycqekjxbplddykt
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy ALL contents from `supabase/migrations/20250111_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### Option B: Using psql Command Line

```bash
psql "postgresql://postgres:SisI2009@db.hixuvycqekjxbplddykt.supabase.co:5432/postgres" < supabase/migrations/20250111_initial_schema.sql
```

### ✅ Verification

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'business_config', 'bookings', 'call_logs');
```

You should see all 4 tables listed.

---

## Step 2: Deploy Edge Functions 🔧

Since Supabase CLI installation is problematic in this environment, we'll deploy functions manually via the dashboard.

### For Each Function:

1. Go to https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/functions
2. Click **Create Function**
3. Enter function name (e.g., `twilio-voice`)
4. Copy the entire code from `supabase/functions/[function-name]/index.ts`
5. Paste into the editor
6. Click **Deploy Function**

### Functions to Deploy (in order):

1. **realtime-session**
   - File: `supabase/functions/realtime-session/index.ts`
   - No verification needed

2. **send-sms**
   - File: `supabase/functions/send-sms/index.ts`

3. **send-confirmation-email**
   - File: `supabase/functions/send-confirmation-email/index.ts`

4. **send-owner-notification**
   - File: `supabase/functions/send-owner-notification/index.ts`

5. **google-calendar-check**
   - File: `supabase/functions/google-calendar-check/index.ts`

6. **google-calendar-create**
   - File: `supabase/functions/google-calendar-create/index.ts`

7. **twilio-voice** ⭐ Most Important
   - File: `supabase/functions/twilio-voice/index.ts`

---

## Step 3: Configure Edge Function Secrets 🔐

1. Go to https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/settings/functions
2. Scroll to **Secrets** section
3. Click **Add Secret** for each of these:

```
Name: OPENAI_API_KEY
Value: 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

Name: TWILIO_ACCOUNT_SID
Value: AC4d821702470b70698ad23e45c9251a93

Name: TWILIO_AUTH_TOKEN
Value: c47a7e6e7b04ca7c47c1b9c9461b5b7a

Name: TWILIO_PHONE_NUMBER
Value: +18108889199

Name: RESEND_API_KEY (Optional - skip if you don't have Resend)
Value: your_resend_api_key
```

4. Click **Save** after adding each secret

---

## Step 4: 🔴 CRITICAL - Configure Twilio Webhook

This is THE MOST IMPORTANT step for voice calls to work!

### Your Webhook URL:
```
https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml
```

### Setup Steps:

1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click on your phone number: **+1 810-888-9199**
3. Scroll to **Voice Configuration** section
4. Under "A CALL COMES IN":
   - Select **Webhook**
   - Paste URL: `https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml`
   - Method: **HTTP POST**
5. Click **Save Configuration**

### ✅ Test It:

**Call your Twilio number: +1 (810) 888-9199**

You should hear the AI assistant answer and greet you!

---

## Step 5: Run the Application 💻

```bash
cd /home/user/Voice-Agent-Project
npm install
npm run dev
```

Then open: http://localhost:5173

You should see the dashboard with all 6 pages!

---

## Step 6: Create Your First User 👤

Since we haven't implemented authentication yet (that's Prompt 2), we need to manually create a test user:

### Option A: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/auth/users
2. Click **Add User**
3. Enter email: `test@example.com`
4. Enter password: `TestPassword123!`
5. Click **Create User**

The trigger function will automatically create:
- A profile entry
- A default business_config entry

### Option B: Using SQL

Run this in SQL Editor:

```sql
-- This will be done automatically when you sign up via the Auth UI
-- For now, you can manually insert a test user's config
INSERT INTO business_config (
  user_id,
  business_name,
  business_type,
  business_category,
  ai_system_instructions,
  greeting_template,
  confirmation_template
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'My Test Business',
  'salon',
  'appointment-based',
  'You are a friendly receptionist for My Test Business. Help customers book appointments warmly and professionally.',
  'Hello! Welcome to My Test Business. How can I help you today?',
  'Hi {customer_name}! Your {service} appointment is confirmed for {date} at {time}. See you then!'
);
```

---

## Step 7: Configure Your Business Settings ⚙️

1. Open the app at http://localhost:5173
2. Go to **Business Settings** (gear icon in sidebar)
3. Update the following:

### Business Information Tab:
- Business Name: Your actual business name
- Business Type: Select from dropdown (salon, restaurant, etc.)
- Phone Number: Your contact number
- Address: Your business address
- Description: What your business does

### AI Assistant Tab:
- AI Voice: Choose from: alloy, echo, fable, onyx, nova, shimmer
- Voice Personality: Professional, Friendly, Casual, or Formal
- System Instructions: Customize how the AI should behave

Example for a salon:
```
You are a friendly receptionist for [Business Name], a professional salon.

Available Services:
- Haircut (60 minutes, $50)
- Hair Coloring (120 minutes, $100)
- Styling (45 minutes, $35)

Your role:
1. Greet warmly and ask what service they're interested in
2. Check calendar availability using check_calendar function
3. Present 2-3 available time slots
4. Collect: name, phone number, email
5. Confirm all details before booking
6. Use create_booking function to complete

Always be warm, professional, and verify information.
```

4. Click **Save Changes**

---

## Step 8: Test the Complete System 🧪

### Test 1: Phone Call

1. Call your Twilio number: **+1 (810) 888-9199**
2. The AI should answer with your greeting
3. Say: "I'd like to book a haircut for tomorrow at 2 PM"
4. Follow the conversation
5. The AI should check availability and confirm the booking

### Test 2: Check the Dashboard

1. Go to **Bookings** page
2. You should see your booking appear in real-time
3. Check the details: customer name, phone, service, date, time

### Test 3: View Call History

1. Go to **Call History** page
2. You should see the call log with:
   - Customer phone number
   - Duration
   - Outcome (booked/no-booking)
   - Transcript (if available)

### Test 4: Web Voice Demo (Future)

The Live Demo page is currently a placeholder. It will be fully implemented in Prompt 4 with WebRTC.

---

## 🐛 Troubleshooting

### Problem: "Call doesn't connect"

**Solution:**
1. Verify Twilio webhook URL is correct
2. Check Edge Function logs in Supabase Dashboard
3. Make sure `twilio-voice` function is deployed
4. Verify secrets are set correctly

### Problem: "AI doesn't respond"

**Solution:**
1. Check OPENAI_API_KEY is valid and has Realtime API access
2. View Edge Function logs for errors
3. Make sure you have GPT-4o Realtime API access

### Problem: "Booking not appearing in dashboard"

**Solution:**
1. Check browser console for errors
2. Verify database connection (VITE_SUPABASE_URL/KEY in .env)
3. Make sure RLS policies are working
4. Check that business_config exists for your user

### Problem: "SMS not sending"

**Solution:**
1. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct
2. Check Twilio phone number is verified
3. Make sure recipient phone number has country code
4. Check Edge Function logs for errors

---

## 📊 Monitoring

### View Edge Function Logs:

1. Go to https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/functions
2. Click on a function name
3. Click **Logs** tab
4. View real-time logs as calls come in

### View Database Data:

```sql
-- View all bookings
SELECT * FROM bookings ORDER BY created_at DESC;

-- View call logs
SELECT * FROM call_logs ORDER BY started_at DESC;

-- View business config
SELECT business_name, business_type, ai_voice FROM business_config;
```

---

## 🎉 You're All Set!

Your Universal AI Booking System is now live and ready to take calls!

**Next Steps:**
- Test with real customers
- Customize AI instructions for your specific business
- Add more services/products
- Configure business hours
- Set up Google Calendar integration (optional)
- Implement user authentication (Prompt 2)

**Need Help?**
- Check Edge Function logs in Supabase Dashboard
- Review Twilio call logs
- Open an issue on GitHub

---

## 📱 Quick Reference

**Your Twilio Number:** +1 (810) 888-9199

**Dashboard URL:** http://localhost:5173

**Webhook URL:** https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml

**Supabase Dashboard:** https://supabase.com/dashboard/project/hixuvycqekjxbplddykt

---

**Happy Booking! 🚀**
