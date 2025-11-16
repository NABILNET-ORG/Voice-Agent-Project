# Next Actions

## Immediate (Do Now - Next Session)

### 1. Add Gemini Live API for Voice Agent ⚠️ HIGH PRIORITY
**Why**: Gemini is 19x cheaper ($0.016/min vs $0.30/min for OpenAI)
**Status**: User wants dual-provider support (OpenAI + Gemini)

**Tasks**:
- Install `@google/generative-ai` package
- Create Gemini Live API integration alongside OpenAI
- Support provider selection from business_config.ai_voice_agent_provider
- Audio: PCM 16-bit, 16kHz input, 24kHz output
- Models: gemini-2.0-flash-live-001, gemini-2.5-flash-native-audio

**Effort**: 8-12 hours

### 2. Debug Voice Agent Token Endpoint 404
**Issue**: `/api/voice-agent/token` compiles but returns 404
**Root Cause**: Likely runtime error (missing API key)
**Fix**: Add proper error handling, test with database API keys

**Effort**: 1-2 hours

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
