-- Add campaign_slot_configurations table
CREATE TABLE IF NOT EXISTS campaign_slot_configurations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR NOT NULL UNIQUE,
  min_credit_score INTEGER NOT NULL,
  max_credit_score INTEGER NOT NULL,
  free_slots INTEGER NOT NULL,
  paid_slots_available INTEGER DEFAULT 0,
  paid_slot_price DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  updated_by VARCHAR,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_slot_configurations_credit_score ON campaign_slot_configurations(min_credit_score, max_credit_score);
CREATE INDEX IF NOT EXISTS idx_campaign_slot_configurations_is_active ON campaign_slot_configurations(is_active);

-- Insert default campaign slot configurations
INSERT INTO campaign_slot_configurations (tier_name, min_credit_score, max_credit_score, free_slots, paid_slots_available, paid_slot_price, description) VALUES
  ('New User', -1, -1, 10, 0, 0.00, 'Free slots for new users (first month)'),
  ('0-20%', 0, 20, 3, 0, 0.00, 'Basic tier for users with 0-20% credit score'),
  ('21-35%', 21, 35, 5, 0, 0.00, 'Bronze tier for users with 21-35% credit score'),
  ('36-50%', 36, 50, 10, 0, 0.00, 'Silver tier for users with 36-50% credit score'),
  ('51-65%', 51, 65, 15, 0, 0.00, 'Gold tier for users with 51-65% credit score'),
  ('66-80%', 66, 80, 20, 0, 0.00, 'Platinum tier for users with 66-80% credit score'),
  ('81-100%', 81, 100, 25, 0, 0.00, 'Diamond tier for users with 81-100% credit score')
ON CONFLICT (tier_name) DO NOTHING;
