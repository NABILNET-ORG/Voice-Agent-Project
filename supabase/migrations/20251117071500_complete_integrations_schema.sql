-- Complete integrations schema for business_config
-- Migration: 20251117071500_complete_integrations_schema.sql
-- Purpose: Add all integration columns that were missing

-- Resend Email Service
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
ADD COLUMN IF NOT EXISTS resend_from_email TEXT,
ADD COLUMN IF NOT EXISTS resend_from_name TEXT;

-- Twilio Voice/SMS Service
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT;

-- Google Analytics
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS google_analytics_tracking_id TEXT,
ADD COLUMN IF NOT EXISTS google_analytics_measurement_id TEXT;

-- Slack Notifications
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS slack_bot_token TEXT,
ADD COLUMN IF NOT EXISTS slack_channel_id TEXT;

-- Zapier Integration
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS zapier_api_key TEXT,
ADD COLUMN IF NOT EXISTS zapier_webhook_url TEXT;

-- QuickBooks Accounting
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS quickbooks_client_id TEXT,
ADD COLUMN IF NOT EXISTS quickbooks_client_secret TEXT,
ADD COLUMN IF NOT EXISTS quickbooks_realm_id TEXT,
ADD COLUMN IF NOT EXISTS quickbooks_access_token TEXT,
ADD COLUMN IF NOT EXISTS quickbooks_refresh_token TEXT;

-- Comments
COMMENT ON COLUMN business_config.resend_api_key IS 'Resend API key for email notifications';
COMMENT ON COLUMN business_config.twilio_account_sid IS 'Twilio Account SID for voice/SMS';
COMMENT ON COLUMN business_config.twilio_auth_token IS 'Twilio Auth Token';
COMMENT ON COLUMN business_config.twilio_phone_number IS 'Twilio phone number with country code';
COMMENT ON COLUMN business_config.google_analytics_tracking_id IS 'Google Analytics tracking ID';
COMMENT ON COLUMN business_config.slack_webhook_url IS 'Slack incoming webhook URL';
COMMENT ON COLUMN business_config.zapier_api_key IS 'Zapier API key';
COMMENT ON COLUMN business_config.quickbooks_client_id IS 'QuickBooks OAuth client ID';
