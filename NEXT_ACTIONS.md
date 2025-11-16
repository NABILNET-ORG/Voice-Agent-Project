# Next Actions

## Immediate (Do This Week - Sprint 1 Completion)

### 1. Complete Calendar Sync (1 hour)
**Status**: 50% done (CREATE works, UPDATE/DELETE pending)

**Tasks:**
- [ ] Add UPDATE calendar sync to `PATCH /api/bookings/[id]`
- [ ] Add DELETE calendar sync to `DELETE /api/bookings/[id]`
- [ ] Test: Update booking → calendar updates
- [ ] Test: Delete booking → calendar event deleted

**Files:** See `SPRINT_1_IMPLEMENTATION.md` for code snippets

---

### 2. Implement Email Service (2 hours)
**Status**: NOT STARTED

**Tasks:**
- [ ] `npm install resend`
- [ ] Create `src/lib/email-service.ts`
- [ ] Create HTML email templates
- [ ] Implement `/api/notifications/send` endpoint
- [ ] Test email delivery

---

### 3. Implement SMS Service (1 hour)
**Status**: NOT STARTED

**Tasks:**
- [ ] `npm install twilio`
- [ ] Create `src/lib/sms-service.ts`
- [ ] Test SMS delivery

---

### 4. Add Notification Triggers (2 hours)
**Status**: NOT STARTED

**Tasks:**
- [ ] Call notifications after booking created
- [ ] Call notifications after booking updated
- [ ] Call notifications after booking cancelled
- [ ] Test end-to-end booking flow with notifications

**Result:** Complete booking workflow (book → calendar → email/SMS)

---

## Short Term (Next Week - Sprint 2)

### 5. Stripe Payment Integration (10 hours)
**Why**: Revenue generation (critical blocker)

**Tasks:**
- [ ] `npm install stripe @stripe/stripe-js`
- [ ] Create `/api/payments/create-intent` endpoint
- [ ] Create `/api/payments/webhook` for Stripe events
- [ ] Add payment UI to booking flow
- [ ] Add `payment_status`, `payment_intent_id` columns to bookings
- [ ] Test payment processing

---

## Medium Term (Week 3 - Sprint 3)

### 6. Twilio Phone Integration (8 hours)
**Why**: Production voice agent (currently web demo only)

**Tasks:**
- [ ] Buy Twilio phone number
- [ ] Create `/api/voice-agent/twilio-webhook` endpoint
- [ ] Implement call routing to OpenAI/Gemini
- [ ] Test incoming calls end-to-end

---

### 7. Call Recording & Transcription (2 hours)
**Tasks:**
- [ ] Enable Twilio recording
- [ ] Implement Whisper transcription
- [ ] Store in call_logs table

---

## Long Term (Week 4 - Sprint 4-6)

### 8. Server-Side Business Config API (2 hours)
- [ ] Create `/api/business-config` GET/PATCH routes
- [ ] Migrate Settings UI to use server routes

### 9. Testing & Security (10 hours)
- [ ] End-to-end testing
- [ ] API key encryption
- [ ] Rate limiting
- [ ] Security audit

### 10. Production Deployment (3 hours)
- [ ] Environment setup
- [ ] Deploy to Vercel
- [ ] Set up monitoring (Sentry)

---

## Priority Order

**This Week:**
1. Complete Sprint 1 (Calendar + Notifications) → 75% ready
2. Start Sprint 2 (Payments) → 80% ready

**Next Week:**
3. Complete Sprint 2 (Payments)
4. Sprint 3 (Phone integration) → 90% ready

**Week 3-4:**
5. Testing, security, deployment → 100% ready

**Target Production Date**: December 15, 2025

---

## Documentation Available

- `AUDIT_REPORT_2025-11-16.md` - Complete system analysis
- `SPRINT_1_IMPLEMENTATION.md` - Sprint 1 guide with code snippets
- `GEMINI_LIVE_API.md` - Gemini integration docs
- Session notes and handoff documents

---

**Last Updated**: November 16, 2025, 7:30 PM
**Current Sprint**: Sprint 1 (40% complete)
**Next Sprint**: Complete Sprint 1, then Sprint 2 (Payments)
