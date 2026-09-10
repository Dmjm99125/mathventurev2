import { createClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from './client';

const studentStorage = typeof window === 'undefined'
  ? undefined
  : window.sessionStorage;

export const studentSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: studentStorage,
    storageKey: 'mathventure-student-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
