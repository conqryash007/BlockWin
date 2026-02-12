-- Withdrawal requests: users request approval for a withdrawal amount; admin approves/rejects
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('ethereum', 'tron')),
  requested_amount DECIMAL(20, 6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_network ON withdrawal_requests(network);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own withdrawal requests
CREATE POLICY "Users can insert own withdrawal requests" ON withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins get full access via service role (no RLS policy for admin; use service role key)
-- So we don't need UPDATE policy for users; only service role will update status

-- Enable Realtime for withdrawal_requests so clients can subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
