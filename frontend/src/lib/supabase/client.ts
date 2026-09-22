import { createClient } from '@supabase/supabase-js';

const runtimeEnv = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env ?? {};
const denoEnv = (globalThis as {
  Deno?: { env?: { get(name: string): string | undefined } };
}).Deno?.env;

const rawSupabaseUrl = runtimeEnv.VITE_SUPABASE_URL ?? denoEnv?.get('VITE_SUPABASE_URL');
const rawSupabaseAnonKey = runtimeEnv.VITE_SUPABASE_ANON_KEY ?? denoEnv?.get('VITE_SUPABASE_ANON_KEY');

if (!rawSupabaseUrl || !rawSupabaseAnonKey) {
  throw new Error('Supabase URL/anon key are missing from the client build.');
}

export const supabaseUrl: string = rawSupabaseUrl;
export const supabaseAnonKey: string = rawSupabaseAnonKey;

// This is the ONLY Supabase client in the app. It is used exclusively for
// authentication (sign up / sign in / sign out / session management).
// It must never be used to query app tables directly -- every table has
// Row Level Security enabled with no policies, so direct queries always
// fail. All data access goes through `invokeFunction` in `../api/client.ts`, which
// invokes a Supabase Edge Function running with the service role key.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
