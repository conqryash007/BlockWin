import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance to be used throughout the app
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const createClient = () => {
  return supabase;
};
