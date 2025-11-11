#!/bin/bash

echo "🚀 Running Database Migration via HTTP..."
echo "==========================================="
echo ""

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHV2eWNxZWtqeGJwbGRkeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQwMywiZXhwIjoyMDc4NDIzNDAzfQ.S-UnAbcHuFmkUPo1f78y0_KlhyOVqxmbWFKIWVjHkcs"
PROJECT_URL="https://hixuvycqekjxbplddykt.supabase.co"

# Read and encode SQL
SQL_CONTENT=$(cat supabase/migrations/20250111_initial_schema.sql)

# Try to execute via REST API
echo "Attempting to execute migration..."
echo ""

# Create a temporary edge function payload
QUERY=$(cat <<'EOF'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
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

CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EOF
)

echo "⚠️  Direct SQL execution from this environment is not possible due to network restrictions."
echo ""
echo "📋 MANUAL MIGRATION REQUIRED"
echo "=============================="
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/sql/new"
echo ""
echo "2. Open the file: supabase/migrations/20250111_initial_schema.sql"
echo ""
echo "3. Copy ALL contents (Ctrl+A, Ctrl+C)"
echo ""
echo "4. Paste into Supabase SQL Editor"
echo ""
echo "5. Click 'Run' button"
echo ""
echo "6. Verify success with this query:"
echo ""
echo "   SELECT table_name FROM information_schema.tables"
echo "   WHERE table_schema = 'public'"
echo "   AND table_name IN ('profiles', 'business_config', 'bookings', 'call_logs');"
echo ""
echo "✅ You should see all 4 tables listed!"
echo ""
echo "See RUN_MIGRATION.md for more details."
