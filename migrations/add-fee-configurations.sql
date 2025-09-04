-- Add fee_configurations table
CREATE TABLE IF NOT EXISTS fee_configurations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR NOT NULL UNIQUE,
  fee_percent DECIMAL(5,4) NOT NULL,
  minimum_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  updated_by VARCHAR,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fee_configurations_transaction_type ON fee_configurations(transaction_type);
CREATE INDEX IF NOT EXISTS idx_fee_configurations_is_active ON fee_configurations(is_active);

-- Insert default fee configurations
INSERT INTO fee_configurations (transaction_type, fee_percent, minimum_fee, description) VALUES
  ('deposit', 0.0100, 1.00, 'Transaction fee for deposits'),
  ('claim_contribution', 0.0350, 1.00, 'Platform fee for claiming contributions'),
  ('claim_tips', 0.0350, 1.00, 'Platform fee for claiming tips'),
  ('withdraw', 0.0100, 1.00, 'Transaction fee for withdrawals')
ON CONFLICT (transaction_type) DO NOTHING;
