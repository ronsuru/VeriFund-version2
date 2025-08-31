-- Simple migration to add new campaign slot fields
-- Run this in your database to add the new columns

-- Add new columns to monthly_campaign_limits table
ALTER TABLE monthly_campaign_limits 
ADD COLUMN IF NOT EXISTS paid_slots_available INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_slot_price INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_first_month BOOLEAN DEFAULT false;

-- Update existing records to have appropriate default values
UPDATE monthly_campaign_limits 
SET 
  paid_slots_available = 0,
  paid_slot_price = 0,
  is_first_month = false
WHERE paid_slots_available IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'monthly_campaign_limits' 
AND column_name IN ('paid_slots_available', 'paid_slot_price', 'is_first_month');
