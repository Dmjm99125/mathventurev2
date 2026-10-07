import { supabase } from '../supabase/client';
import {
  invokeTeacherFunction,
  resetActiveAuthClient,
  setActiveAuthClient,
  type Role,
} from '../api';
import { studentSupabase } from '../supabase/student-client';
import {
  buildVerifyOtpParams,
  isStudentSessionPayload,
  type StudentSessionPayload,
} from './student-auth';
import { profileFromAuthSession, type UserProfile } from './profile';
import {
  createPasswordVerifier,
  getOrCreateDeviceId,
  verifyPasswordVerifier,
  type OfflineCredentialRecord,
} from '../offline/classroom/crypto';
import type { OfflineStore } from '../offline/classroom/store';
import { createIndexedDbStore } from '../offline/classroom/store';

export type OfflineEnrollmentRecord = {
  deviceId: string;
  verifier: OfflineCredentialRecord;
  profile: UserProfile;
};

const fallbackDeviceStorage = new Map<string, string>();

function getDeviceStorage(): Map<string, string> | Storage {
  return typeof window === 'undefined' ? fallbackDeviceStorage : window.localStorage;
}

export async function enrollOfflineDevice(
  profile: UserProfile,
  password: string,
  store: OfflineStore = createIndexedDbStore(),
): Promise<OfflineEnrollmentRecord> {
  if (profile.role !== 'teacher') {
    throw new Error('Only teacher accounts can enroll this classroom device.');
  }
  const verifier = await createPasswordVerifier(password);
  const deviceId = getOrCreateDeviceId(getDeviceStorage());
  const record: OfflineEnrollmentRecord = { deviceId, verifier, profile };
  await store.put('meta', { key: 'offlineEnrollment', value: record });
  await store.put('meta', { key: 'deviceId', value: deviceId });
  return record;
}

export async function readOfflineEnrollment(
  store: OfflineStore = createIndexedDbStore(),
): Promise<OfflineEnrollmentRecord | null> {
  const record = (await store.get('meta', 'offlineEnrollment'))?.value;
  if (!record || typeof record !== 'object') return null;
  const candidate = record as Partial<OfflineEnrollmentRecord>;
  if (!candidate.deviceId || !candidate.verifier || !candidate.profile) return null;
  return candidate as OfflineEnrollmentRecord;
}

export class OfflineAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfflineAuthError';
  }
}

export async function offlineSignIn(
  password: string,
  store: OfflineStore = createIndexedDbStore(),
): Promise<UserProfile> {
  const enrollment = await readOfflineEnrollment(store);
  if (!enrollment) {
    throw new OfflineAuthError('No offline account is enrolled on this device.');
  }
  const valid = await verifyPasswordVerifier(password, enrollment.verifier);
  if (!valid) throw new OfflineAuthError('Incorrect offline password.');
  await store.put('meta', { key: 'offlineSession', value: enrollment.profile });
  return enrollment.profile;
}

export async function readOfflineSession(
  store: OfflineStore = createIndexedDbStore(),
): Promise<UserProfile | null> {
  const value = (await store.get('meta', 'offlineSession'))?.value;
  if (!value || typeof value !== 'object') return null;
  const profile = value as Partial<UserProfile>;
  return typeof profile.id === 'string' && profile.role === 'teacher' && typeof profile.full_name === 'string'
    ? profile as UserProfile
    : null;
}

export async function offlineSignOut(store: OfflineStore = createIndexedDbStore()): Promise<void> {
  await store.delete('meta', 'offlineSession');
}

export type TeacherReturnAuthError = { message: string };

export type TeacherReturnDeps = {
  getTeacherEmail: () => Promise<string | null>;
  verifyTeacherPassword: (
    email: string,
    password: string,
  ) => Promise<TeacherReturnAuthError | null>;
  signOutStudent: () => Promise<TeacherReturnAuthError | null>;
};

const defaultTeacherReturnDeps: TeacherReturnDeps = {
  async getTeacherEmail() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user.email ?? null;
  },
  async verifyTeacherPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { message: error.message } : null;
  },
  async signOutStudent() {
    const { error } = await studentSupabase.auth.signOut();
    return error ? { message: error.message } : null;
  },
};

// Auth (sign up / sign in / sign out / session) talks to Supabase Auth
// directly via the anon client -- this is the one exception to "always go
// through an edge function", since Supabase Auth is itself the
// authorization system, not app data.

export async function teacherSignUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'teacher', full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function teacherSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function viewStudentAccount(studentId: string): Promise<UserProfile> {
  const response = await invokeTeacherFunction<StudentSessionPayload>('student-view-as', {
    method: 'POST',
    body: { studentId },
  });

  if (!isStudentSessionPayload(response)) {
    throw new Error("We couldn't open that student account.");
  }

  const { data, error } = await studentSupabase.auth.verifyOtp(
    buildVerifyOtpParams(response),
  );
  if (error) throw error;

  const profile = profileFromAuthSession(data.session);
  if (!profile || profile.role !== 'student') {
    await studentSupabase.auth.signOut();
    throw new Error("We couldn't open that student account.");
  }

  setActiveAuthClient(studentSupabase);
  return profile;
}

export async function returnToTeacherAccount(
  password: string,
  deps: TeacherReturnDeps = defaultTeacherReturnDeps,
) {
  if (!password.trim()) {
    throw new Error('Teacher password is required.');
  }

  const email = await deps.getTeacherEmail();
  if (!email) {
    throw new Error('Teacher session unavailable.');
  }

  const verifyError = await deps.verifyTeacherPassword(email, password);
  if (verifyError) {
    throw new Error('Incorrect teacher password.');
  }

  const signOutError = await deps.signOutStudent();
  if (signOutError) throw new Error(signOutError.message);
  resetActiveAuthClient();
}

export async function signUp(email: string, password: string, role: Role, fullName: string) {
  if (role !== 'teacher') {
    throw new Error('Student sign up requires the name-based student flow.');
  }
  return teacherSignUp(email, password, fullName);
}

export async function signIn(email: string, password: string) {
  return teacherSignIn(email, password);
}

export async function signOut() {
  const [studentResult, teacherResult] = await Promise.all([
    studentSupabase.auth.signOut(),
    supabase.auth.signOut(),
  ]);
  resetActiveAuthClient();
  await offlineSignOut().catch(() => {});
  if (studentResult.error) throw studentResult.error;
  if (teacherResult.error) throw teacherResult.error;
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
