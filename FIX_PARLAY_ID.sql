-- Fix: Add missing parlay_id column to sports_bets table
-- Run this in Supabase Dashboard SQL Editor

-- Add the parlay_id column if it doesn't exist
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

-- Create the index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_sports_bets_parlay_id ON sports_bets(parlay_id);

-- Add comment
COMMENT ON COLUMN sports_bets.parlay_id IS 'UUID to group multiple selections in a parlay bet';
