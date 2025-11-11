#!/bin/bash

# Verification Script for Universal AI Booking System
# Run this after setting up the database and edge functions

echo "🔍 Verifying Universal AI Booking System Setup..."
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment variables
echo "1. Checking Environment Variables..."
if [ -f .env ]; then
    if grep -q "VITE_SUPABASE_URL=https://hixuvycqekjxbplddykt.supabase.co" .env; then
        echo -e "${GREEN}✓${NC} Supabase URL configured"
    else
        echo -e "${RED}✗${NC} Supabase URL not configured"
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
        echo -e "${GREEN}✓${NC} Supabase anon key configured"
    else
        echo -e "${RED}✗${NC} Supabase anon key missing"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
fi
echo ""

# Check if build works
echo "2. Checking Build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Application builds successfully"
else
    echo -e "${RED}✗${NC} Build failed - run 'npm run build' for details"
fi
echo ""

# Check critical files
echo "3. Checking Critical Files..."
FILES=(
    "supabase/migrations/20250111_initial_schema.sql"
    "supabase/functions/twilio-voice/index.ts"
    "supabase/functions/realtime-session/index.ts"
    "QUICK_START.md"
    "DEPLOYMENT_GUIDE.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done
echo ""

# Summary
echo "=================================================="
echo "Setup Status:"
echo "=================================================="
echo ""
echo -e "${YELLOW}TODO:${NC} Manual steps remaining:"
echo ""
echo "1. Run database migration in Supabase Dashboard"
echo "   URL: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/sql/new"
echo "   File: supabase/migrations/20250111_initial_schema.sql"
echo ""
echo "2. Deploy edge functions (see QUICK_START.md)"
echo ""
echo "3. Configure edge function secrets:"
echo "   - OPENAI_API_KEY"
echo "   - TWILIO_ACCOUNT_SID"
echo "   - TWILIO_AUTH_TOKEN"
echo "   - TWILIO_PHONE_NUMBER"
echo ""
echo "4. 🔴 CRITICAL: Configure Twilio webhook"
echo "   URL: https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml"
echo ""
echo "5. Test by calling: +1 (810) 888-9199"
echo ""
echo "See QUICK_START.md for detailed instructions!"
echo ""
