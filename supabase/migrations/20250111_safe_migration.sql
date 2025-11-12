-- Safe migration - only creates missing tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension (safe if already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (skip if exists)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
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

        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Users can insert own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- =====================================================
-- BUSINESS_CONFIG TABLE
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_config') THEN
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

          -- AI Configuration
          ai_voice TEXT NOT NULL DEFAULT 'alloy',
          ai_voice_personality TEXT NOT NULL DEFAULT 'friendly',
          ai_system_instructions TEXT NOT NULL DEFAULT 'You are a helpful business assistant.',
          greeting_template TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
          confirmation_template TEXT NOT NULL DEFAULT 'Your booking is confirmed for {date} at {time}.',
          openai_api_key TEXT,

          -- Twilio Configuration
          twilio_account_sid TEXT,
          twilio_auth_token TEXT,
          twilio_phone_number TEXT,

          -- Business Hours & Services (JSONB)
          business_hours JSONB DEFAULT '{}'::jsonb,
          services JSONB DEFAULT '[]'::jsonb,

          -- Timestamps
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own config" ON business_config
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can update own config" ON business_config
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own config" ON business_config
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE INDEX idx_business_config_user_id ON business_config(user_id);
    END IF;
END $$;

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        CREATE TABLE bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

          -- Customer Information
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          customer_email TEXT,

          -- Booking Details
          service_or_item TEXT NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          duration_minutes INTEGER,
          quantity INTEGER DEFAULT 1,

          -- Pricing
          price_per_unit DECIMAL(10, 2),
          total_amount DECIMAL(10, 2),

          -- Status & Type
          status TEXT NOT NULL DEFAULT 'pending',
          booking_type TEXT NOT NULL DEFAULT 'appointment',

          -- Additional Info
          notes TEXT,
          confirmation_sent BOOLEAN DEFAULT FALSE,
          reminder_sent BOOLEAN DEFAULT FALSE,

          -- Related Call
          call_log_id UUID,

          -- Timestamps
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own bookings" ON bookings
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own bookings" ON bookings
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own bookings" ON bookings
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete own bookings" ON bookings
          FOR DELETE USING (auth.uid() = user_id);

        CREATE INDEX idx_bookings_user_id ON bookings(user_id);
        CREATE INDEX idx_bookings_date ON bookings(date);
        CREATE INDEX idx_bookings_status ON bookings(status);
        CREATE INDEX idx_bookings_customer_phone ON bookings(customer_phone);
    END IF;
END $$;

-- =====================================================
-- CALL_LOGS TABLE
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs') THEN
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

        ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own call logs" ON call_logs
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own call logs" ON call_logs
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own call logs" ON call_logs
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
        CREATE INDEX idx_call_logs_started_at ON call_logs(started_at);
        CREATE INDEX idx_call_logs_outcome ON call_logs(outcome);
    END IF;
END $$;

-- =====================================================
-- TRIGGER FUNCTION FOR NEW USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NOW(),
    NOW()
  );

  -- Create business config with defaults
  INSERT INTO public.business_config (
    user_id,
    business_name,
    business_type,
    business_category,
    currency,
    ai_voice,
    ai_voice_personality,
    ai_system_instructions,
    greeting_template,
    confirmation_template,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'My Business',
    'salon',
    'appointment-based',
    'USD',
    'alloy',
    'friendly',
    'You are a helpful AI assistant for booking appointments. Be professional, friendly, and efficient.',
    'Hello! Thank you for calling. How can I help you today?',
    'Your appointment is confirmed for {date} at {time}. We look forward to seeing you!',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! All tables and triggers are now set up.';
END $$;
