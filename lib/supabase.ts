import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvnyxvapeorjcxljtszc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bnl4dmFwZW9yamN4bGp0c3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTgwOTMsImV4cCI6MjA4MzQzNDA5M30.LB0V84KAjIbD4Nh-asXuJH5r6qcY1Vc6dNTbzOfhfH8';

// Create a single instance to be used throughout the app
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export const createClient = () => {
  return supabase;
};
