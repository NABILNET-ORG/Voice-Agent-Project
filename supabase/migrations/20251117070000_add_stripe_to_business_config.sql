-- Add Stripe configuration columns to business_config
-- Migration: 20251117070000_add_stripe_to_business_config.sql

-- Add Stripe API keys
ALTER TABLE business_config
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT;

-- Comments
COMMENT ON COLUMN business_config.stripe_secret_key IS 'Stripe secret key for payment processing';
COMMENT ON COLUMN business_config.stripe_publishable_key IS 'Stripe publishable key for frontend';
COMMENT ON COLUMN business_config.stripe_webhook_secret IS 'Stripe webhook signing secret for verification';
