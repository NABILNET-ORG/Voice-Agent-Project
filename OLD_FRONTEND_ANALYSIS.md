# Old Frontend Backend Integration Analysis - Summary

## Overview
The backup frontend implements a voice-powered booking system with direct Supabase integration and WebRTC voice communication to OpenAI.

## 1. API Endpoints

### Supabase Edge Functions
1. **create-booking-manual**
   - POST to: {VITE_SUPABASE_URL}/functions/v1/create-booking-manual
   - Auth: Bearer token
   - Body: customerName, customerPhone, customerEmail, serviceOrItem, bookingType, date, time, durationMinutes, basePrice, totalAmount, deliveryAddress, notes
   - Response: { success: boolean, error?: string }

2. **realtime-session**
   - invoke('realtime-session')
   - Body: { model: 'gpt-4o-realtime-preview-2024-12-17' }
   - Response: { client_secret: { value: string } }
   - Purpose: Get ephemeral token for OpenAI Realtime API

### Direct Supabase Queries
- profiles (user info)
- business_config (AI settings, booking rules)
- bookings (appointments/orders)
- call_logs (voice call records)

## 2. Key Data Structures

### business_config (Comprehensive)
- Business Info: name, type, category, description, phone, address, website
- Localization: language, currency, timezone
- Services: JSON array with id, name, description, duration, price
- Hours: business_hours JSON, is_24_7, break_times
- Booking Rules: buffer, advance_days, same_day, max_per_day
- Delivery: zones, default_time, min_amount, max_radius
- AI Config: voice, personality, system_instructions, templates
- Call Settings: duration, sensitivity, speed, recording, noise_handling
- Notifications: email/sms flags, reminders, triggers
- Google Calendar: ID, sync enabled, frequency, templates
- Payment: methods, require_upfront, deposit_amount

### bookings
- id, user_id, call_log_id
- customer_name, customer_phone, customer_email, customer_address
- service_or_item, category, quantity, items (JSON)
- date, time, duration_minutes, estimated_completion, delivery_time_estimate
- base_price, delivery_fee, service_fee, tax_amount, discount_amount, total_amount
- status, priority, google_calendar_event_id
- notes, special_instructions, assigned_to, cancellation_reason
- created_at, updated_at

### call_logs
- id, user_id, call_sid
- customer_phone, customer_name
- started_at, ended_at, duration_seconds
- outcome (booked/no-booking/missed/ordered), booking_type
- transcript (JSON array: {role, text, timestamp})
- sentiment, booking_id, recording_url, recording_duration

## 3. Features Implementation

### Authentication
- Supabase Auth (email/password)
- AuthContext with session management
- Protected routes with ProtectedRoute component
- JWT token in Authorization header

### Voice Calling (Live Demo)
1. Fetch business config: ai_system_instructions, ai_voice, business_name
2. Request microphone with echoCancellation, noiseSuppression, autoGainControl
3. Get ephemeral token from realtime-session function
4. Create RTCPeerConnection
5. Add audio tracks and create data channel
6. Send OpenAI session config (instructions, voice, formats, turn_detection)
7. WebRTC SDP exchange with OpenAI Realtime endpoint
8. Handle events: conversation, transcription, response, voice activity

Status: ready → connecting → listening → processing → error/done

### Bookings Management
- List with search (name/phone), filter, sort
- Calendar view (month/week/day)
- Create via BookingFormModal → calls create-booking-manual function
- Services fetched from business_config.services
- CSV export
- Stats: Today's count, weekly total, revenue, confirmed count

### Call History
- List all calls ordered by started_at
- Transcript viewer modal
- Stats: Total calls, successful bookings, avg duration, conversion rate
- Outcome badges: booked, no-booking, missed, ordered
- CSV export

### Analytics
- Client-side aggregation of booking data
- Charts: Revenue over time (line), Bookings by day (bar), Service popularity (pie), Peak hours (stacked bar)
- Stats: Total revenue, total bookings, avg value, unique customers

### Settings
- Business info editing (name, type, phone, address)
- AI configuration (voice, personality, instructions, templates)
- Business hours and break times
- Service management
- Notification settings (email, SMS, reminders, owner alerts)
- Google Calendar integration (placeholder)
- Payment settings

### Account
- Profile information (mostly UI placeholders)
- Subscription display (Free plan)
- Security settings (placeholder)

## 4. Authentication & Authorization

Flow:
1. User signs up/logs in with Supabase Auth
2. JWT session created, stored in browser localStorage
3. All API calls include Authorization: Bearer {token}
4. Row-level security policies enforce user_id ownership
5. Protected routes check session.user exists

## 5. Third-Party Integrations

### Google Calendar
- OAuth tokens stored in profiles table
- Calendar ID and sync settings in business_config
- Sync frequency and event templates configurable
- Implementation: Server-side (not visible in frontend)

### OpenAI Realtime API
- Direct WebRTC from browser
- Model: gpt-4o-realtime-preview-2024-12-17
- Audio: PCM16 format
- Transcription: Whisper-1
- Voice: Configurable from business_config

### Twilio (Inferred)
- Recording URLs in call_logs
- Call SID tracking
- Server-side webhooks for call logging/recording

## 6. Architecture Patterns

### State Management
- React Context (AuthContext only)
- Component-level useState
- No Redux/Zustand
- Custom hook: useRealtimeAPI

### Fetch Pattern
- useEffect to load data
- useState for state
- try/catch error handling
- Loading states

### Component Organization
- UI components in components/ui/ (Radix UI wrappers)
- Feature components: BookingFormModal, BusinessHoursEditor, etc.
- Pages in pages/ directory
- Utilities: supabase client, formatters

### Libraries
- Tailwind CSS (styling)
- Radix UI (components)
- Lucide React (icons)
- Recharts (charts)
- React Router (navigation)

## 7. Missing/Limited Features

Gaps:
- No pagination (loads all records)
- No offline support
- No request caching
- No error boundaries
- No input validation framework
- Google Calendar sync not implemented
- Subscription/billing not functional
- Manual booking only (no auto-booking from calls)
- No real-time sync (Supabase subscriptions not used)

Scalability Issues:
- All bookings/calls loaded at once
- Client-side analytics computation
- No lazy loading

## 8. Security

Implemented:
- JWT authentication
- Protected routes
- Row-level security (backend)
- Session token management

Missing:
- Input sanitization
- CSRF protection
- Rate limiting
- Error logging

## 9. Development Stack

- Vite (build tool)
- React + TypeScript
- @supabase/supabase-js
- Radix UI
- Tailwind CSS
- Recharts
- Lucide icons
- React Router

## 10. Backend Integration Summary

**Type:** Client-Centric Direct-to-Database

**Components:**
- Frontend: React + Supabase SDK
- Auth: Supabase Auth
- Database: Supabase PostgreSQL
- Edge Functions: create-booking-manual, realtime-session
- Voice API: OpenAI Realtime (direct WebRTC)
- Recording: Twilio webhooks (server-side)
- Calendar: Google Calendar OAuth (server-side)

**If Building Modern Backend, It Should Provide:**
- REST/GraphQL API gateway
- Business logic validation
- Error handling middleware
- Rate limiting
- Caching layer
- Webhook aggregation
- Payment processing
- Admin endpoints
- Logging/monitoring
