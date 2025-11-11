-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  language_preference TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  google_calendar_access_token TEXT,
  google_calendar_refresh_token TEXT,
  google_calendar_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- BUSINESS_CONFIG TABLE
-- =====================================================
CREATE TABLE business_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Information
  business_name TEXT NOT NULL DEFAULT 'My Business',
  business_type TEXT NOT NULL DEFAULT 'salon',
  business_category TEXT NOT NULL DEFAULT 'appointment-based',
  business_description TEXT,
  phone_number TEXT,
  address TEXT,
  website TEXT,
  primary_language TEXT NOT NULL DEFAULT 'en',
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Services/Products (Flexible JSON structure)
  services JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Hours & Availability
  business_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_24_7 BOOLEAN DEFAULT false,

  -- Appointment-based settings
  booking_buffer_minutes INTEGER DEFAULT 15,
  max_advance_booking_days INTEGER DEFAULT 30,
  min_advance_booking_hours INTEGER DEFAULT 0,
  allow_same_day BOOLEAN DEFAULT true,
  max_appointments_per_day INTEGER,
  break_times JSONB DEFAULT '[]'::jsonb,

  -- Delivery settings
  delivery_zones JSONB DEFAULT '[]'::jsonb,
  default_delivery_time_minutes INTEGER DEFAULT 30,
  minimum_order_amount DECIMAL(10,2),
  max_delivery_radius_km DECIMAL(10,2),
  accept_orders_outside_hours BOOLEAN DEFAULT false,

  -- Service call settings
  service_areas TEXT[],
  emergency_available BOOLEAN DEFAULT false,
  emergency_surcharge DECIMAL(10,2),
  weekend_surcharge DECIMAL(10,2),
  after_hours_surcharge DECIMAL(10,2),
  response_times JSONB,

  -- Calendar Integration
  google_calendar_id TEXT DEFAULT 'primary',
  google_calendar_sync_enabled BOOLEAN DEFAULT false,
  calendar_sync_frequency TEXT DEFAULT 'realtime',
  calendar_event_title_template TEXT DEFAULT '{service} - {customer_name}',
  add_customer_phone_to_event BOOLEAN DEFAULT true,
  set_event_reminder BOOLEAN DEFAULT true,
  event_reminder_minutes INTEGER DEFAULT 60,

  -- AI Configuration
  ai_voice TEXT NOT NULL DEFAULT 'alloy',
  ai_voice_personality TEXT NOT NULL DEFAULT 'friendly',
  ai_system_instructions TEXT NOT NULL DEFAULT 'You are a helpful business assistant.',
  greeting_template TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
  confirmation_template TEXT NOT NULL DEFAULT 'Your booking is confirmed for {date} at {time}.',

  enable_small_talk BOOLEAN DEFAULT true,
  ask_for_email BOOLEAN DEFAULT true,
  confirm_before_booking BOOLEAN DEFAULT true,
  send_instant_confirmation BOOLEAN DEFAULT true,
  max_call_duration_minutes INTEGER DEFAULT 10,

  voice_detection_sensitivity TEXT DEFAULT 'medium',
  speech_speed TEXT DEFAULT 'normal',
  enable_call_recording BOOLEAN DEFAULT false,
  background_noise_handling TEXT DEFAULT 'balanced',

  -- Notifications
  customer_notification_email BOOLEAN DEFAULT true,
  customer_notification_sms BOOLEAN DEFAULT true,
  send_reminder_notifications BOOLEAN DEFAULT false,
  reminder_hours_before INTEGER DEFAULT 24,
  notification_language TEXT,

  owner_notification_email TEXT,
  send_owner_email BOOLEAN DEFAULT true,
  owner_notification_phone TEXT,
  send_owner_sms BOOLEAN DEFAULT false,
  notification_triggers JSONB DEFAULT '["new_booking","cancellation"]'::jsonb,

  -- Payment Settings
  accepted_payment_methods JSONB DEFAULT '["cash"]'::jsonb,
  require_payment_upfront BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10,2),
  deposit_type TEXT DEFAULT 'fixed',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on business_config
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;

-- Business Config RLS Policies
CREATE POLICY "Users can view own config" ON business_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config" ON business_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config" ON business_config
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own config" ON business_config
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_log_id UUID,

  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  delivery_instructions TEXT,

  -- Booking Details
  booking_type TEXT NOT NULL DEFAULT 'appointment',
  service_or_item TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 1,
  items JSONB,

  -- Scheduling
  date DATE,
  time TIME,
  duration_minutes INTEGER,
  estimated_completion TIMESTAMPTZ,
  delivery_time_estimate TEXT,

  -- Pricing
  base_price DECIMAL(10,2),
  delivery_fee DECIMAL(10,2),
  service_fee DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'confirmed',
  priority TEXT DEFAULT 'standard',

  -- Integration
  google_calendar_event_id TEXT,
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,

  -- Additional Details
  notes TEXT,
  special_instructions TEXT,
  assigned_to TEXT,

  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Bookings RLS Policies
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookings" ON bookings
  FOR DELETE USING (auth.uid() = user_id);

-- Bookings Indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_phone ON bookings(customer_phone);

-- =====================================================
-- CALL_LOGS TABLE
-- =====================================================
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Call Details
  call_sid TEXT,
  customer_phone TEXT,
  customer_name TEXT,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Outcome
  outcome TEXT NOT NULL DEFAULT 'in-progress',
  booking_type TEXT,

  -- Conversation Data
  transcript JSONB DEFAULT '[]'::jsonb,
  sentiment TEXT,

  -- Related Booking
  booking_id UUID REFERENCES bookings(id),

  -- Recording
  recording_url TEXT,
  recording_duration INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on call_logs
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Call Logs RLS Policies
CREATE POLICY "Users can view own call logs" ON call_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own call logs" ON call_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call logs" ON call_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Call Logs Indexes
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX idx_call_logs_started_at ON call_logs(started_at);
CREATE INDEX idx_call_logs_outcome ON call_logs(outcome);

-- =====================================================
-- TRIGGER FUNCTION FOR NEW USERS
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));

  -- Create default business config for new user
  INSERT INTO business_config (
    user_id,
    business_name,
    business_type,
    business_category,
    services,
    business_hours,
    ai_system_instructions
  ) VALUES (
    NEW.id,
    'My Business',
    'salon',
    'appointment-based',
    '[
      {
        "name": "Service 1",
        "category": "General",
        "duration": 60,
        "price": 50,
        "requiresSlot": true,
        "bufferTime": 15,
        "availableDays": ["mon","tue","wed","thu","fri","sat"]
      }
    ]'::jsonb,
    '{
      "monday": {"open": "09:00", "close": "18:00"},
      "tuesday": {"open": "09:00", "close": "18:00"},
      "wednesday": {"open": "09:00", "close": "18:00"},
      "thursday": {"open": "09:00", "close": "18:00"},
      "friday": {"open": "09:00", "close": "18:00"},
      "saturday": {"open": "10:00", "close": "16:00"},
      "sunday": {"open": null, "close": null}
    }'::jsonb,
    'You are a friendly business assistant helping customers book appointments or place orders. Be warm, professional, and efficient. Always verify information before confirming bookings.'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- UPDATE TIMESTAMP TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_business_config_updated_at
  BEFORE UPDATE ON business_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
