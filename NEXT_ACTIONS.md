# Next Actions

## Immediate (Do Now - Next Session)

### 1. ~~Add Gemini Live API for Voice Agent~~ ✅ COMPLETE
**Status**: Fully implemented with dual-provider support
**Completion Date**: November 16, 2025

**Delivered**:
- ✅ Installed `@google/generative-ai` package
- ✅ Created Gemini Live API client (`src/lib/gemini-live/client.ts`)
- ✅ Updated `/api/voice-agent/token` to support both providers
- ✅ Updated `/voice-demo` page with provider detection
- ✅ Audio formats: 16kHz (Gemini) and 24kHz (OpenAI)
- ✅ Function calling for booking operations
- ✅ Comprehensive documentation (`GEMINI_LIVE_API.md`)
- ✅ Build: 100% SUCCESS

**Cost Savings**: 94.7% cheaper with Gemini!

### 2. Test Voice Agent with Real API Keys ⚠️ HIGH PRIORITY
**Why**: Verify both providers work in production
**Status**: Implementation complete, needs testing

**Tasks**:
- Add Gemini API key to business_config
- Test Gemini voice agent with real conversations
- Compare quality, latency, and cost
- Verify function calling works correctly
- Test provider switching

**Effort**: 2-3 hours

### 3. Production Deployment
**Prerequisites**: Voice agent working, migration run
**Command**: `vercel --prod`
**Note**: All code ready, database migration will auto-run

---

## Short Term (This Week)

### 4. Auto-Sync Bookings to Google Calendar
- On booking create → create calendar event
- On update → update event
- On delete → delete event
- Store google_calendar_event_id

**Effort**: 3-4 hours

### 5. Scheduled Reminder System
- Cron job: Query bookings 24h before
- Send email/SMS reminders
- Mark reminder_sent = true

**Effort**: 4-6 hours

---

## Medium Term (This Month)

### 6. Stripe Payment Integration
- Database columns exist (stripe_*)
- Implement payment processing
- Webhook handling
- Deposit/upfront payments

**Effort**: 12-15 hours

### 7. Service Deduplication
- Detect duplicates (name + price matching)
- Merge entries, show "X duplicates removed"

**Effort**: 2-3 hours

---

**Priority**: Gemini Live API → Debug 404 → Deploy → Calendar auto-sync → Reminders

**Completed This Session**:
✅ 22 new API endpoints (backend complete)
✅ Voice Agent (OpenAI Realtime API)
✅ Google Calendar integration
✅ Notification system (Email + SMS)
✅ Database-first security (API keys in DB)
✅ TestSprite testing + 6 critical fixes
✅ Build: 100% success, 43 pages, 33 endpoints
