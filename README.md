# 🤖 AI Voice Agent Booking System

An intelligent, AI-powered universal booking system with real-time voice capabilities, multi-modal service extraction, and comprehensive business management.

**🔗 Production:** https://voice-agent-project-8q9fko36f-nabils-projects-447e19b8.vercel.app

## ✨ Technology Stack

### 🎯 Core Framework
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS** - Utility-first CSS framework
- **🗄️ Supabase** - PostgreSQL database with real-time subscriptions
- **🧩 shadcn/ui** - High-quality component library

### 🤖 AI & Voice Technologies
- **🎙️ OpenAI Realtime API** - Real-time voice conversations with WebRTC
- **🧠 Google Gemini AI** - Service extraction and content summarization
- **💬 Anthropic Claude** - Optional AI provider integration

### 🌐 Web Scraping & Content
- **🕷️ Cheerio** - Fast HTML parsing and manipulation
- **📝 Turndown** - HTML to Markdown converter
- **📖 Readability** - Mozilla's content extraction algorithm
- **🌐 JSDOM** - JavaScript implementation of web standards

### 🗄️ Database & Authentication
- **🔐 Supabase Auth** - Complete authentication system
- **📊 PostgreSQL** - Relational database via Supabase
- **🔑 API Key Management** - Secure storage for AI provider keys

## 🎯 Key Features

### 🎙️ **Live Voice Agent Demo**
- Real-time voice conversations with typing animation
- WebRTC audio streaming with OpenAI Realtime API
- Booking tools integration (check_availability, create_booking)
- Comprehensive business context loading
- Real-time transcript with character-by-character animation

### 📅 **Intelligent Booking System**
- Availability checking with calendar integration
- Automated booking creation and confirmation
- Google Calendar sync
- Booking history and status management
- Configurable scheduling policies (buffer times, advance notice, max per day)

### 🤖 **AI-Powered Service Extraction**
**URL Extraction (3 modes):**
- Single Page: Quick extraction
- Deep: Thorough analysis of current page
- Full Crawl: Multi-page discovery with deduplication

**Knowledge Base Extraction (3 modes):**
- Quick: Top 2-3 sources (fast)
- Full: All sources via batching
- Batch: One-by-one with progress tracking

### 📚 **Knowledge Base Management**
- Smart website crawling (3 modes)
- Product/service page filtering
- Content summarization with AI
- Source editing (title, priority, summary)
- Automatic deduplication

### ⚙️ **Comprehensive Settings**
- Business Information (name, type, contact, timezone)
- Service/Product Management with AI extraction
- AI Provider Configuration (OpenAI, Gemini, Anthropic)
- Availability & Scheduling Policies
- Notification Settings (Email, SMS, WhatsApp)
- Multi-language Support (Arabic, English)
- Middle East timezone support

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and API keys

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 📖 Documentation

- **[SESSION_STATE.md](SESSION_STATE.md)** - Current implementation status
- **[NEXT_ACTIONS.md](NEXT_ACTIONS.md)** - Upcoming features and priorities
- **[PRD.md](PRD.md)** - Complete product requirements

## 🔧 Configuration

1. **Supabase Setup:**
   - Create project at supabase.com
   - Run database migrations
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`

2. **AI API Keys:**
   - OpenAI: For Realtime voice agent
   - Google Gemini: For service extraction (configure in Settings > Integrations)
   - Optional: Anthropic Claude

3. **Google Calendar (Optional):**
   - Set up OAuth credentials
   - Configure in Settings > Integrations

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── page.tsx             # Live Demo (voice agent)
│   ├── bookings/            # Booking management
│   ├── calls/               # Call history
│   ├── analytics/           # Analytics dashboard
│   ├── settings/            # Business settings
│   │   ├── page.tsx         # Business info, KB, notifications
│   │   ├── services/        # Service extraction & management
│   │   └── integrations/    # AI provider configuration
│   └── api/
│       ├── route.ts         # OpenAI ephemeral token
│       ├── voice-agent/     # Voice context API
│       ├── services/        # Service extraction APIs
│       ├── knowledge/       # KB crawling & summarization
│       └── bookings/        # Booking APIs
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── KnowledgeBaseManager.tsx
│   ├── app-sidebar.tsx
│   └── nav-*.tsx
├── hooks/
│   ├── useRealtimeAPI.ts    # Voice agent WebRTC hook
│   └── useAuth.ts           # Authentication hook
└── lib/
    ├── supabase.ts          # Supabase client
    └── api.ts               # API client functions
```

## 🔄 Recent Updates (Nov 15, 2025)

### ✅ Completed This Session
- **6 Extraction Modes Total**
  - URL: Single Page, Deep, Full Crawl
  - KB: Quick, Full, Batch (with progress tracking)
- **Smart Filtering** (excludes policies, registration, cart, media files)
- **All 26 KB Sources** accessible (uses summary OR content)
- **Bilingual Support** (preserves original language, auto-translates)
- **KB Source Management** (edit title, priority, summary)
- **Voice-Synced Typing** (real-time audio_transcript.delta)
- **Working Booking APIs** (check_availability, create_booking)
- **Real Booking Creation** (saves to database, no fake confirmations)
- **Complete Backup System** (17 services + 26 KB sources)
- **Clean UI** (removed mock data, professional interface)

### 📊 Commits: 35+ | Files Modified: 12 | Deployed: ✅ Production

## 🚀 Deployment

**Latest Production URL:** https://voice-agent-project-gr2jzfb5h-nabils-projects-447e19b8.vercel.app

**Previous URLs:**
- https://voice-agent-project-qzdggust6-nabils-projects-447e19b8.vercel.app
- https://voice-agent-project-9bdgak5tp-nabils-projects-447e19b8.vercel.app
- https://voice-agent-project-8q9fko36f-nabils-projects-447e19b8.vercel.app

```bash
# Deploy to production
vercel --prod

# Check deployment logs
vercel logs
```

---

**Token Usage: 339.3K/1000.0K (33.9%), 660.7K remaining**
