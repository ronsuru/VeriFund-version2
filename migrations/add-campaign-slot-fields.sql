-- Migration: Add new fields to monthly_campaign_limits table
-- Date: 2024-12-19
-- Description: Add paid slots and first month tracking fields

-- Add new columns to monthly_campaign_limits table
ALTER TABLE monthly_campaign_limits 
ADD COLUMN IF NOT EXISTS paid_slots_available INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_slot_price INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_first_month BOOLEAN NOT NULL DEFAULT false;

-- Update existing records to have appropriate default values
UPDATE monthly_campaign_limits 
SET 
  paid_slots_available = 0,
  paid_slot_price = 0,
  is_first_month = false
WHERE paid_slots_available IS NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN monthly_campaign_limits.paid_slots_available IS 'Number of paid slots available for purchase this month';
COMMENT ON COLUMN monthly_campaign_limits.paid_slot_price IS 'Price in PHP for purchasing additional slots';
COMMENT ON COLUMN monthly_campaign_limits.is_first_month IS 'Whether this is the user''s first month (gets bonus slots)';
