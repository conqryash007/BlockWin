-- Complete migration to ensure sports_bets table has all required columns
-- This handles both creating the table and adding missing columns

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS sports_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  market_type TEXT NOT NULL,
  selection TEXT NOT NULL,
  odds DECIMAL(10, 2) NOT NULL,
  stake DECIMAL(10, 2) NOT NULL,
  bet_fee DECIMAL(10, 2) NOT NULL,
  potential_payout DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  parlay_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'won', 'lost', 'void', 'cashed_out'))
);

-- Add parlay_id column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sports_bets' 
        AND column_name = 'parlay_id'
    ) THEN
        ALTER TABLE sports_bets ADD COLUMN parlay_id UUID;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sports_bets_user_id ON sports_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_status ON sports_bets(status);
CREATE INDEX IF NOT EXISTS idx_sports_bets_parlay_id ON sports_bets(parlay_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_created_at ON sports_bets(created_at DESC);

-- Add comments
COMMENT ON TABLE sports_bets IS 'Stores all sports betting records including single and parlay bets';
COMMENT ON COLUMN sports_bets.parlay_id IS 'UUID to group multiple selections in a parlay bet';
COMMENT ON COLUMN sports_bets.bet_fee IS 'House edge fee calculated as 5% of potential profit';
COMMENT ON COLUMN sports_bets.potential_payout IS 'Potential payout after deducting bet fee';
