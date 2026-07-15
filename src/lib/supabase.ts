import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL/anon key are missing from the client build.');
}

// This is the ONLY Supabase client in the app. It is used exclusively for
// authentication (sign up / sign in / sign out / session management).
// It must never be used to query app tables directly -- every table has
// Row Level Security enabled with no policies, so direct queries always
// fail. All data access goes through `callFunction` in `./api.ts`, which
// invokes a Supabase Edge Function running with the service role key.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
