'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, ExternalLink, Database } from 'lucide-react';
import { toast } from 'sonner';

const MIGRATION_SQL = `-- Create sports_bets table for storing user sports betting records
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
COMMENT ON COLUMN sports_bets.potential_payout IS 'Potential payout after deducting bet fee';`;

const FIX_PARLAY_ID_SQL = `-- Fix: Add missing parlay_id column to sports_bets table
-- Use this if you get "column parlay_id does not exist" error

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
COMMENT ON COLUMN sports_bets.parlay_id IS 'UUID to group multiple selections in a parlay bet';`;

export default function MigrationsPage() {
  const [copied, setCopied] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);
  const [showFix, setShowFix] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    toast.success('SQL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyFixToClipboard = () => {
    navigator.clipboard.writeText(FIX_PARLAY_ID_SQL);
    setCopiedFix(true);
    toast.success('Fix SQL copied to clipboard!');
    setTimeout(() => setCopiedFix(false), 2000);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-casino-brand" />
        <div>
          <h1 className="text-3xl font-bold text-white">Database Migration</h1>
          <p className="text-muted-foreground">Run the sports_bets table migration</p>
        </div>
      </div>

      <Card className="bg-casino-panel border-white/5">
        <CardHeader>
          <CardTitle>Sports Bets Table Migration</CardTitle>
          <CardDescription>
            This migration creates the sports_bets table required for the sports betting feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#0a0c10] rounded-lg p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Migration SQL</span>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>
            <pre className="text-xs text-muted-foreground overflow-x-auto font-mono">
              {MIGRATION_SQL}
            </pre>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-white">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-casino-brand hover:underline inline-flex items-center gap-1">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a></li>
              <li>Select your project</li>
              <li>Click on <strong>"SQL Editor"</strong> in the left sidebar</li>
              <li>Click <strong>"New query"</strong></li>
              <li>Paste the SQL above (or click "Copy SQL" button)</li>
              <li>Click <strong>"Run"</strong> to execute the migration</li>
              <li>Verify the table was created by checking the Table Editor</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-white/5">
            <Button
              variant="casino"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="w-full gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Supabase Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fix for missing parlay_id column */}
      <Card className="bg-casino-panel border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fix: Missing parlay_id Column</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFix(!showFix)}
            >
              {showFix ? 'Hide' : 'Show Fix'}
            </Button>
          </CardTitle>
          <CardDescription>
            If you're getting "column parlay_id does not exist" error, run this fix SQL.
          </CardDescription>
        </CardHeader>
        {showFix && (
          <CardContent className="space-y-4">
            <div className="bg-[#0a0c10] rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Fix SQL</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyFixToClipboard}
                  className="gap-2"
                >
                  {copiedFix ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground overflow-x-auto font-mono">
                {FIX_PARLAY_ID_SQL}
              </pre>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
