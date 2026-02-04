-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own balance" ON balances
    FOR SELECT USING (auth.uid() = user_id);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    house_edge DECIMAL(5, 4) NOT NULL DEFAULT 0.0100, -- 1% default
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are public readable" ON games
    FOR SELECT USING (true);
    
-- Seed initial games
INSERT INTO games (name, slug, house_edge, is_active)
VALUES 
    ('Mines', 'mines', 0.0100, true),
    ('Dice', 'dice', 0.0100, true),
    ('Plinko', 'plinko', 0.0100, true),
    ('Crash', 'crash', 0.0100, true)
ON CONFLICT (slug) DO NOTHING;

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL, -- references games.slug
    bet_amount DECIMAL(20, 2) NOT NULL,
    bet_fee DECIMAL(20, 2) NOT NULL DEFAULT 0,
    outcome JSONB NOT NULL DEFAULT '{}',
    payout DECIMAL(20, 2) NOT NULL DEFAULT 0,
    server_seed TEXT NOT NULL,
    client_seed TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game sessions" ON game_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Create sports_bets table (from existing migration idea)
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

CREATE INDEX IF NOT EXISTS idx_sports_bets_user_id ON sports_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_status ON sports_bets(status);
CREATE INDEX IF NOT EXISTS idx_sports_bets_parlay_id ON sports_bets(parlay_id);

ALTER TABLE sports_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sports bets" ON sports_bets
    FOR SELECT USING (auth.uid() = user_id);

-- Create lottery_rooms table
CREATE TABLE IF NOT EXISTS lottery_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_stake DECIMAL(20, 2) NOT NULL,
    max_stake DECIMAL(20, 2) NOT NULL,
    settlement_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open, closed, settled
    payout_type TEXT NOT NULL DEFAULT 'winner_takes_all',
    created_by TEXT NOT NULL, -- might be admin ID or system
    winners JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lottery_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lottery rooms are public readable" ON lottery_rooms
    FOR SELECT USING (true);

-- Create lottery_entries table
CREATE TABLE IF NOT EXISTS lottery_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES lottery_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stake_amount DECIMAL(20, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lottery_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lottery entries are public readable" ON lottery_entries
    FOR SELECT USING (true);
    
CREATE POLICY "Users can insert their own entries" ON lottery_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
