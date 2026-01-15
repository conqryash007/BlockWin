import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for admin operations
// This should only be used in API routes, never on the client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvnyxvapeorjcxljtszc.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations will fail.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
