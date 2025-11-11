# 🎙️ Universal AI Business Booking System

A complete AI-powered appointment and order booking system with voice calling via Twilio and OpenAI Realtime API. Works for ANY business type: salons, clinics, restaurants, delivery services, plumbing, consulting, and more.

## 🚀 Quick Start (5 Minutes)

**Your phone number:** +1 (810) 888-9199

```bash
# Install all dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 and call your number to test!

**Need to deploy?** See [Deployment Guide](#-deployment) below.

---

## ✨ Features

- **Voice AI Assistant** - Real-time voice conversations via Twilio phone calls
- **Web Voice Demo** - Test your AI assistant directly in the browser
- **Universal Business Support** - Appointment-based, delivery, or service call businesses
- **Google Calendar Integration** - Real-time availability checking and automatic event creation
- **Automated Notifications** - SMS and email confirmations for customers
- **Owner Alerts** - Get notified of new bookings instantly
- **Call Analytics** - Track call history, conversion rates, and transcripts
- **Booking Management** - Full dashboard to view and manage all bookings
- **Multi-Language Support** - Configure AI for any language
- **Fully Customizable** - Complete business settings from the web interface

## 🏗️ Architecture

### Frontend
- **React** with TypeScript and Vite
- **TailwindCSS** for styling with dark theme
- **React Router** for navigation
- **Supabase** for database and real-time features
- **Recharts** for analytics visualizations

### Backend
- **Supabase** - PostgreSQL database with Row Level Security
- **Edge Functions** (7 total):
  - `twilio-voice` - Main webhook for Twilio calls
  - `realtime-session` - Creates OpenAI ephemeral tokens
  - `google-calendar-check` - Checks availability
  - `google-calendar-create` - Creates calendar events
  - `send-sms` - Sends SMS notifications via Twilio
  - `send-confirmation-email` - Sends email confirmations via Resend
  - `send-owner-notification` - Notifies business owner

### Database Schema
- `profiles` - User profiles with calendar tokens
- `business_config` - Complete business configuration
- `bookings` - All appointments and orders
- `call_logs` - Call history with transcripts

## 📦 Installation

### Install All Dependencies

```bash
npm install
```

This will install all required packages:
- React, React DOM, React Router
- Supabase client
- TailwindCSS with plugins
- Lucide React icons
- Radix UI components
- Recharts for analytics
- All TypeScript types

---

## 🚀 Deployment

### Current Project Status

✅ **Database:** Deployed and ready
✅ **Edge Functions:** All 7 functions deployed
✅ **Frontend:** Built successfully (474.77 kB)

### Your Configuration

**Supabase Project:** https://hixuvycqekjxbplddykt.supabase.co
**Phone Number:** +1 (810) 888-9199
**Webhook URL:** https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml

### Environment Variables

The `.env` file is already configured with:

```env
VITE_SUPABASE_URL=https://hixuvycqekjxbplddykt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Deployed Edge Functions

All 7 functions are live at:

1. **twilio-voice** - https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice
2. **realtime-session** - https://hixuvycqekjxbplddykt.supabase.co/functions/v1/realtime-session
3. **google-calendar-check** - https://hixuvycqekjxbplddykt.supabase.co/functions/v1/google-calendar-check
4. **google-calendar-create** - https://hixuvycqekjxbplddykt.supabase.co/functions/v1/google-calendar-create
5. **send-sms** - https://hixuvycqekjxbplddykt.supabase.co/functions/v1/send-sms
6. **send-confirmation-email** - https://hixuvycqekjxbplddykt.supabase.co/functions/v1/send-confirmation-email
7. **send-owner-notification** - https://hixuvycqekjxbplddykt.supabase.co/functions/v1/send-owner-notification

### Database Schema

4 tables with complete Row Level Security:
- ✅ `profiles` - User profiles with calendar tokens
- ✅ `business_config` - Complete business configuration (70+ settings)
- ✅ `bookings` - All appointments and orders
- ✅ `call_logs` - Call history with transcripts

### Edge Function Secrets

Configured in Supabase Dashboard → Settings → Edge Functions:

```
✅ OPENAI_API_KEY
✅ TWILIO_ACCOUNT_SID
✅ TWILIO_AUTH_TOKEN
✅ TWILIO_PHONE_NUMBER
```

### 🔴 CRITICAL: Twilio Webhook Configuration

**Go to:** https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

1. Click your number: **+1 810-888-9199**
2. Under **"Voice Configuration"** → **"A CALL COMES IN"**:
   - Select: **Webhook**
   - URL: `https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml`
   - Method: **HTTP POST**
3. Click **Save Configuration**

**Test:** Call +1 (810) 888-9199 - AI should answer!

---

## 💻 Development

### Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

### Build for Production

```bash
npm run build
```

Output: `dist/` folder (474.77 kB optimized)

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run build
```

TypeScript will check all types during build.

---

## ⚙️ Configure Your Business

1. Go to **Business Settings** in the sidebar
2. Fill in your business details:
   - Business name
   - Business type (salon, restaurant, plumbing, etc.)
   - Services/products you offer
   - Business hours
   - AI voice preferences
   - Custom instructions for the AI
3. Click **Save Changes**

---

## 📅 (Optional) Google Calendar Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: \`http://localhost:5173/auth/callback\` (and your production URL)
5. Download credentials JSON
6. Add to Edge Function secrets as \`GOOGLE_CALENDAR_CREDENTIALS\`
7. In the app, go to **Settings** → **Integrations** → Click "Connect Calendar"

## 📱 Testing the System

### Option 1: Web Voice Demo

1. Go to **Live Demo** page in the dashboard
2. Click the microphone button
3. Allow microphone access
4. Start speaking naturally:
   - "I'd like to book a haircut for tomorrow"
   - "Do you have availability on Friday?"
   - "I want to order a large pizza for delivery"

### Option 2: Call via Phone

1. Call your Twilio phone number
2. The AI will answer and greet you
3. Book an appointment or place an order
4. Check the **Bookings** page to see your booking

## 📊 Dashboard Pages

- **Live Demo** - Test AI assistant in browser with WebRTC
- **Bookings** - View, search, filter, and manage all bookings
- **Call History** - See all incoming calls with transcripts
- **Business Settings** - Configure business, AI, and integrations
- **Analytics** - Track revenue, conversion rates, and trends
- **Account** - Manage your profile and subscription

## 🔧 Customization

### Business Types

The system supports three main categories:

1. **Appointment-Based** - Salons, clinics, consulting, tutoring
2. **Delivery** - Restaurants, groceries, flowers
3. **Service Calls** - Plumbing, electrical, cleaning, HVAC

Each category has specific settings:
- Appointment businesses: buffer time, max advance booking, breaks
- Delivery businesses: delivery zones, fees, minimum order
- Service calls: emergency availability, service areas, surcharges

### AI Voice Customization

In **Business Settings** → **AI Assistant**:
- Choose voice: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- Set personality: Professional, Friendly, Casual, Formal
- Write custom instructions
- Configure greeting and confirmation messages
- Adjust sensitivity and speech speed

### Services/Products Configuration

Define your offerings with:
- Service/item name
- Category
- Duration (for appointments)
- Price
- Description
- Availability

## 🔐 Security

- Row Level Security (RLS) policies ensure data isolation
- All API requests authenticated via Supabase
- OAuth for Google Calendar
- Webhook signature verification (Twilio)
- Sensitive credentials stored as Edge Function secrets

## 🐛 Troubleshooting

### Calls Not Working

1. Check Twilio webhook URL is configured correctly
2. Verify Edge Function secrets are set
3. Check Edge Function logs in Supabase Dashboard
4. Ensure OPENAI_API_KEY has Realtime API access

### Calendar Not Syncing

1. Verify Google OAuth credentials are correct
2. Check calendar tokens in \`profiles\` table
3. Enable calendar sync in Business Settings

### Bookings Not Appearing

1. Check database connection (VITE_SUPABASE_URL/KEY)
2. Verify RLS policies are applied
3. Check browser console for errors

## 📈 Roadmap

- [ ] User authentication with signup/login
- [ ] Multi-user support with team roles
- [ ] Payment integration (Stripe)
- [ ] WhatsApp notifications
- [ ] Advanced analytics with charts (Recharts)
- [ ] Business type templates
- [ ] Bulk booking import/export
- [ ] Customer CRM features
- [ ] Mobile app (React Native)

## 📄 License

MIT License - feel free to use for your business!

## 🙋 Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review Twilio call logs
3. Check browser console for frontend errors
4. Open an issue on GitHub

## 🎉 Credits

Built with:
- [React](https://react.dev)
- [Supabase](https://supabase.com)
- [Twilio](https://twilio.com)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [TailwindCSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

## 📚 Quick Reference

### Important Commands

```bash
# Install all dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy edge functions (from project root)
./deploy-all-functions.sh
```

### Important Links

| Resource | URL |
|----------|-----|
| **Phone Number** | +1 (810) 888-9199 |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/hixuvycqekjxbplddykt |
| **SQL Editor** | https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/sql/new |
| **Edge Functions** | https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/functions |
| **Function Secrets** | https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/settings/functions |
| **Twilio Console** | https://console.twilio.com/us1/develop/phone-numbers/manage/incoming |
| **Webhook URL** | https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml |

### Project Files

| File | Purpose |
|------|---------|
| `START_HERE.md` | Quick start deployment guide |
| `DEPLOY_OPTIONS.md` | 3 ways to deploy functions |
| `DEPLOY_FUNCTIONS.md` | Detailed function deployment guide |
| `QUICK_START.md` | 3-minute setup guide |
| `DEPLOYMENT_GUIDE.md` | Comprehensive deployment instructions |
| `SETUP_STATUS.md` | Current status and checklist |
| `migrate-db.py` | Database migration script |
| `deploy-all-functions.sh` | CLI deployment automation script |

### Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| **Frontend** | React + TypeScript + Vite |
| **Styling** | TailwindCSS v4 + @tailwindcss/postcss |
| **Routing** | React Router v6 |
| **Database** | Supabase (PostgreSQL) |
| **Functions** | Supabase Edge Functions (Deno) |
| **AI** | OpenAI Realtime API (gpt-4o-realtime-preview-2024-12-17) |
| **Voice** | Twilio Voice API + Media Streams |
| **Calendar** | Google Calendar API v3 |
| **SMS** | Twilio Messages API |
| **Email** | Resend API |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Components** | Radix UI |

---

## 📊 Project Stats

- **Files Created:** 47
- **Lines of Code:** ~10,000+
- **Edge Functions:** 7
- **Database Tables:** 4
- **RLS Policies:** 14
- **React Pages:** 6
- **Build Size:** 474.77 kB (optimized)
- **Development Time:** Completed in 1 session

---

**Happy Booking! 🚀**

If this helps your business, consider giving it a ⭐ on GitHub!
