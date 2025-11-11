# 🎙️ Universal AI Business Booking System

A complete AI-powered appointment and order booking system with voice calling via Twilio and OpenAI Realtime API. Works for ANY business type: salons, clinics, restaurants, delivery services, plumbing, consulting, and more.

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

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Twilio account with a phone number
- OpenAI API key with Realtime API access
- (Optional) Resend API key for emails
- (Optional) Google OAuth credentials for calendar

### 2. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd Voice-Agent-Project
npm install
\`\`\`

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to **Settings** → **API** and copy:
   - Project URL
   - \`anon\` public key

3. Create a \`.env\` file in the project root:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

4. Run the database migration:
   - Go to **SQL Editor** in Supabase Dashboard
   - Copy the contents of \`supabase/migrations/20250111_initial_schema.sql\`
   - Paste and run the SQL

### 4. Deploy Edge Functions to Supabase

\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your_project_ref

# Deploy all functions
supabase functions deploy twilio-voice
supabase functions deploy realtime-session
supabase functions deploy google-calendar-check
supabase functions deploy google-calendar-create
supabase functions deploy send-sms
supabase functions deploy send-confirmation-email
supabase functions deploy send-owner-notification
\`\`\`

### 5. Configure Edge Function Secrets

In Supabase Dashboard → **Edge Functions** → **Secrets**, add:

\`\`\`
OPENAI_API_KEY=sk-your-openai-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
RESEND_API_KEY=re_your-resend-api-key
\`\`\`

**Note:** RESEND_API_KEY is optional. Email notifications will be skipped if not provided.

### 6. 🔴 CRITICAL: Configure Twilio Webhook

After deploying the edge functions, you'll get a URL like:
\`\`\`
https://YOUR_PROJECT_REF.supabase.co/functions/v1/twilio-voice/twiml
\`\`\`

**IMPORTANT:** You MUST configure this URL in Twilio for calls to work:

1. Go to [Twilio Console](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Click on your phone number
3. Scroll to **Voice & Fax** section
4. Under "A CALL COMES IN":
   - Select **Webhook**
   - Paste your edge function URL: \`https://YOUR_PROJECT_REF.supabase.co/functions/v1/twilio-voice/twiml\`
   - Method: **HTTP POST**
5. Click **Save**

**Test it:** Call your Twilio number - you should hear the AI assistant!

### 7. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:5173 - you should see the dashboard!

### 8. Configure Your Business

1. Go to **Business Settings** in the sidebar
2. Fill in your business details:
   - Business name
   - Business type (salon, restaurant, plumbing, etc.)
   - Services/products you offer
   - Business hours
   - AI voice preferences
   - Custom instructions for the AI
3. Click **Save Changes**

### 9. (Optional) Set Up Google Calendar Integration

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

**Happy Booking! 🚀**

If this helps your business, consider giving it a ⭐ on GitHub!
