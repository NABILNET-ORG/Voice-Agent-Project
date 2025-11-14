# Old Frontend - Complete Summary

## Quick Reference

### 1. Supabase Tables
- profiles: User info
- business_config: Settings (100+ fields for AI, hours, services, notifications, payments)
- bookings: Appointments/orders
- call_logs: Voice call records

### 2. Edge Functions
- create-booking-manual: POST to create bookings
- realtime-session: Get ephemeral OpenAI token

### 3. Key Features

Authentication:
- Supabase Auth (email/password)
- JWT in Authorization header
- Session in browser localStorage

Voice Calling:
- OpenAI Realtime API (WebRTC)
- Model: gpt-4o-realtime-preview-2024-12-17
- Audio: PCM16 format
- Transcription: Whisper-1

Bookings:
- List, create, view, export to CSV
- Services from business_config.services
- Status tracking: pending, confirmed, cancelled, completed

Call History:
- View all calls
- Transcript viewer
- Outcome tracking: booked, no-booking, missed, ordered
- CSV export

Analytics:
- Client-side data aggregation
- Charts: Revenue, bookings, services, peak hours

### 4. Architecture

Client-Centric Direct-to-Database
- Frontend talks directly to Supabase
- No traditional backend API
- Edge Functions for special operations
- WebRTC direct to OpenAI

### 5. Data Structures

bookings table:
- customer info (name, phone, email, address)
- service details (item, type, category, quantity)
- scheduling (date, time, duration)
- pricing (base, delivery fee, tax, discount, total)
- status and tracking

call_logs table:
- call info (phone, duration, outcome)
- transcript (JSON array of messages)
- sentiment, call_sid (Twilio)
- recording info

business_config table:
- Business info, localization
- Services (JSON array)
- Hours and break times
- Booking rules and delivery settings
- AI voice configuration
- Call settings
- Notification settings
- Payment settings
- Google Calendar integration

### 6. Missing/Limited Features
- No pagination
- No offline support
- No caching
- No error boundaries
- No real-time subscriptions
- Google Calendar sync (server-side)
- No auto-booking from calls

### 7. State Management
- React Context (AuthContext)
- Component useState
- No Redux/Zustand
- Custom hook: useRealtimeAPI

### 8. Key Files
- lib/supabase.ts: Client setup
- contexts/AuthContext.tsx: Auth logic
- hooks/useRealtimeAPI.ts: Voice API
- components/BookingFormModal.tsx: Booking creation
- pages/Bookings.tsx: Booking list/management
- pages/CallHistory.tsx: Call logs
- pages/Analytics.tsx: Dashboard
- pages/Settings.tsx: Config UI
- types/database.ts: TypeScript types

### 9. Third-Party Integrations
- OpenAI Realtime: Direct WebRTC
- Google Calendar: OAuth (server-side)
- Twilio: Recording/call tracking (webhooks)

