-- Add missing parlay_id column if it doesn't exist
-- This migration fixes the case where the table was created without parlay_id

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sports_bets' 
        AND column_name = 'parlay_id'
    ) THEN
        ALTER TABLE sports_bets ADD COLUMN parlay_id UUID;
        CREATE INDEX IF NOT EXISTS idx_sports_bets_parlay_id ON sports_bets(parlay_id);
        COMMENT ON COLUMN sports_bets.parlay_id IS 'UUID to group multiple selections in a parlay bet';
    END IF;
END $$;
