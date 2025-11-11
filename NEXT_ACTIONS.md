# Next Actions - Universal AI Booking System

**Last Updated:** 2025-11-11
**Current Phase:** Week 2 - Configuration & Management

---

## 🔥 Immediate Actions (Required Before Testing)

### 1. Deploy Edge Functions via Supabase Dashboard
**Priority:** CRITICAL
**Time:** 15 minutes

Deploy these functions manually:

1. **get-user-by-phone** (new)
   - Path: `supabase/functions/get-user-by-phone/index.ts`
   - Purpose: Lookup users by phone number

2. **create-booking-manual** (new)
   - Path: `supabase/functions/create-booking-manual/index.ts`
   - Purpose: Create bookings from dashboard

3. **twilio-voice** (updated)
   - Path: `supabase/functions/twilio-voice/index.ts`
   - Purpose: Handle calls with logging

**How:** Supabase Dashboard → Edge Functions → Create/Update → Copy code → Deploy

---

### 2. Test Core Functionality
**Priority:** HIGH
**Time:** 30 minutes

- [ ] Login/Signup flow
- [ ] Create manual booking via "New Booking" button
- [ ] Make test phone call to Twilio number
- [ ] Verify call appears in Call History page
- [ ] Check call_logs table has complete data

---

## 🎯 Week 2 Development Tasks

### Phase 3: Services Editor (Mon-Tue)
**Effort:** 2 days
**Goal:** Allow users to configure available services

#### Tasks:
- [ ] Create `src/components/ServicesEditor.tsx`
  - CRUD interface for services
  - Name, description, duration, price fields
  - Save to `business_config.services` JSONB

- [ ] Update Settings page to include ServicesEditor
- [ ] Test services appear in booking form dropdown

---

### Phase 4: Business Hours Editor (Wed-Thu)
**Effort:** 2 days
**Goal:** Allow users to set business hours

#### Tasks:
- [ ] Create `src/components/BusinessHoursEditor.tsx`
  - Day-by-day hour configuration
  - Open/close times
  - Closed days checkbox
  - Save to `business_config.business_hours` JSONB

- [ ] Update Settings page to include BusinessHoursEditor
- [ ] Test hours affect availability checks

---

### Phase 5: Booking Management (Fri)
**Effort:** 1 day
**Goal:** Edit and cancel existing bookings

#### Tasks:
- [ ] Create `supabase/functions/update-booking/index.ts`
  - Accept booking updates
  - Send update notifications

- [ ] Create `supabase/functions/cancel-booking/index.ts`
  - Change status to 'cancelled'
  - Send cancellation notifications
  - Delete calendar event if synced

- [ ] Update Bookings page:
  - Make rows clickable
  - Show booking details modal
  - Add Edit/Cancel buttons

---

## 📅 Week 3+ Roadmap

### Week 3: Integrations
- Google Calendar OAuth flow
- Calendar event sync improvements
- Live Demo WebRTC (start)

### Week 4: Live Demo & Polish
- Complete WebRTC implementation
- Analytics dashboard with real data
- Account settings page

### Week 5: Production Hardening
- Security enhancements
- Error handling
- Testing & documentation

---

## 🐛 Known Technical Debt

1. **Bundle Size:** 566 kB is large
   - Consider code splitting
   - Lazy load routes

2. **Missing TypeScript Types:**
   - Add types for all Supabase queries
   - Create shared interfaces

3. **Error Handling:**
   - Add error boundaries
   - Improve user-facing error messages

4. **Accessibility:**
   - Add ARIA labels
   - Keyboard navigation
   - Screen reader support

---

## 📝 Documentation Needs

- [ ] API documentation for edge functions
- [ ] User guide for dashboard
- [ ] Twilio webhook configuration guide
- [ ] Environment variables reference
- [ ] Database schema documentation

---

## 🎯 Success Criteria (Week 2)

- ✅ Users can configure services from UI
- ✅ Users can set business hours from UI
- ✅ Users can edit/cancel bookings from dashboard
- ✅ All changes save correctly to database
- ✅ AI uses configured services/hours in conversations
