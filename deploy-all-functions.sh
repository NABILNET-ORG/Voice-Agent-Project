#!/bin/bash

# Universal AI Booking System - Deploy All Edge Functions
# Run this script on your local machine after installing Supabase CLI

echo "🚀 Deploying 7 Edge Functions to Supabase..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Install it first:"
    echo "  macOS:   brew install supabase/tap/supabase"
    echo "  Windows: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "           scoop install supabase"
    echo "  Linux:   brew install supabase/tap/supabase"
    echo ""
    echo "Or visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo "✓ Supabase CLI found"
echo ""

# Link to your project
echo "📡 Linking to Supabase project..."
supabase link --project-ref hixuvycqekjxbplddykt

echo ""
echo "📤 Deploying functions..."
echo ""

# Deploy all functions
supabase functions deploy twilio-voice
supabase functions deploy realtime-session
supabase functions deploy google-calendar-check
supabase functions deploy google-calendar-create
supabase functions deploy send-sms
supabase functions deploy send-confirmation-email
supabase functions deploy send-owner-notification

echo ""
echo "🔐 Setting secrets..."
echo ""

# Set secrets (you'll be prompted for your access token)
supabase secrets set OPENAI_API_KEY="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"
supabase secrets set TWILIO_ACCOUNT_SID="AC4d821702470b70698ad23e45c9251a93"
supabase secrets set TWILIO_AUTH_TOKEN="c47a7e6e7b04ca7c47c1b9c9461b5b7a"
supabase secrets set TWILIO_PHONE_NUMBER="+18108889199"

echo ""
echo "✅ All functions deployed and secrets configured!"
echo ""
echo "🔴 NEXT: Configure Twilio webhook:"
echo "   URL: https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml"
echo "   Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
echo ""
echo "📞 Test by calling: +1 (810) 888-9199"
