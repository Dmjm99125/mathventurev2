import { supabase } from './supabase';
import type { Role } from './api';

// Auth (sign up / sign in / sign out / session) talks to Supabase Auth
// directly via the anon client -- this is the one exception to "always go
// through an edge function", since Supabase Auth is itself the
// authorization system, not app data.

export async function signUp(email: string, password: string, role: Role, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(): Promise<{ id: string; role: Role; full_name: string } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', session.user.id)
    .maybeSingle();
  // Reading one's own profile row is allowed to fail closed like any other
  // table (RLS denies it) -- this is a best-effort convenience read. If it
  // fails, callers fall back to metadata already present on the session.
  if (error || !data) {
    return {
      id: session.user.id,
      role: (session.user.user_metadata?.role as Role) ?? 'student',
      full_name: (session.user.user_metadata?.full_name as string) ?? '',
    };
  }
  return data as { id: string; role: Role; full_name: string };
}
