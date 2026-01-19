-- Create sports_bets table for storing user sports betting records
CREATE TABLE IF NOT EXISTS sports_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  market_type TEXT NOT NULL, -- 'h2h' | 'spreads' | 'totals' | 'parlay'
  selection TEXT NOT NULL,
  odds DECIMAL(10, 2) NOT NULL,
  stake DECIMAL(10, 2) NOT NULL,
  bet_fee DECIMAL(10, 2) NOT NULL,
  potential_payout DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'won' | 'lost' | 'void' | 'cashed_out'
  parlay_id UUID, -- For grouping parlay bets
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'won', 'lost', 'void', 'cashed_out'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sports_bets_user_id ON sports_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_status ON sports_bets(status);
CREATE INDEX IF NOT EXISTS idx_sports_bets_parlay_id ON sports_bets(parlay_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_created_at ON sports_bets(created_at DESC);

-- Add comment to table
COMMENT ON TABLE sports_bets IS 'Stores all sports betting records including single and parlay bets';
COMMENT ON COLUMN sports_bets.parlay_id IS 'UUID to group multiple selections in a parlay bet';
COMMENT ON COLUMN sports_bets.bet_fee IS 'House edge fee calculated as 5% of potential profit';
COMMENT ON COLUMN sports_bets.potential_payout IS 'Potential payout after deducting bet fee';
