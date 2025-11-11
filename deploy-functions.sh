#!/bin/bash

# Deploy All Edge Functions to Supabase
# This script deploys all 7 edge functions

set -e

echo "🚀 Deploying Universal AI Booking System Edge Functions"
echo "=================================================="
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  - macOS: brew install supabase/tap/supabase"
    echo "  - Linux: Check https://supabase.com/docs/guides/cli/getting-started"
    echo "  - Or use the Supabase Dashboard to deploy manually"
    echo ""
    exit 1
fi

# Check if logged in
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase!"
    echo "Please run: supabase login"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Project not linked!"
    echo "Please run: supabase link --project-ref hixuvycqekjxbplddykt"
    exit 1
fi

echo "✅ Ready to deploy!"
echo ""

# Deploy each function
FUNCTIONS=(
    "realtime-session"
    "send-sms"
    "send-confirmation-email"
    "send-owner-notification"
    "google-calendar-check"
    "google-calendar-create"
    "twilio-voice"
)

for func in "${FUNCTIONS[@]}"; do
    echo "📦 Deploying $func..."
    if supabase functions deploy "$func" --no-verify-jwt; then
        echo "✅ $func deployed successfully!"
    else
        echo "❌ Failed to deploy $func"
        exit 1
    fi
    echo ""
done

echo ""
echo "🎉 All functions deployed successfully!"
echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo ""
echo "1. Configure secrets in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/settings/functions"
echo ""
echo "   Add these secrets:"
echo "   - OPENAI_API_KEY"
echo "   - TWILIO_ACCOUNT_SID"
echo "   - TWILIO_AUTH_TOKEN"
echo "   - TWILIO_PHONE_NUMBER"
echo "   - RESEND_API_KEY (optional)"
echo ""
echo "2. 🔴 CRITICAL: Configure Twilio Webhook"
echo "   Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
echo "   Set webhook to: https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml"
echo ""
echo "3. Test by calling: +1 (810) 888-9199"
echo ""
echo "Happy Booking! 🚀"
