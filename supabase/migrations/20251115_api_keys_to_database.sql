-- Migration: Move API keys from environment to database
-- Date: 2025-11-15
-- Purpose: Add missing API key columns to business_config for proper multi-tenant architecture

-- Add missing API key columns to business_config table
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS zapier_api_key TEXT,
ADD COLUMN IF NOT EXISTS quickbooks_company_id TEXT,
ADD COLUMN IF NOT EXISTS quickbooks_access_token TEXT,
ADD COLUMN IF NOT EXISTS quickbooks_refresh_token TEXT;

-- Add comments for documentation
COMMENT ON COLUMN business_config.resend_api_key IS 'Resend email service API key for sending booking confirmations and notifications';
COMMENT ON COLUMN business_config.stripe_publishable_key IS 'Stripe publishable key for payment processing';
COMMENT ON COLUMN business_config.stripe_secret_key IS 'Stripe secret key for payment processing (encrypted in app)';
COMMENT ON COLUMN business_config.twilio_account_sid IS 'Twilio Account SID for SMS notifications';
COMMENT ON COLUMN business_config.twilio_auth_token IS 'Twilio Auth Token for SMS (encrypted in app)';
COMMENT ON COLUMN business_config.twilio_phone_number IS 'Twilio phone number for sending SMS';
COMMENT ON COLUMN business_config.slack_webhook_url IS 'Slack webhook URL for notifications';
COMMENT ON COLUMN business_config.zapier_api_key IS 'Zapier API key for automation integrations';

-- Note: Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are app-level
-- and should remain in environment variables as they're shared across all users.
-- Google Calendar user tokens are stored in profiles table (google_calendar_access_token, google_calendar_refresh_token)

-- Migration complete
-- Users can now manage their own API keys via Settings → Integrations page
