import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockSupabase = vi.hoisted(() => {
  const subscription = { unsubscribe: vi.fn() };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription } })),
    },
    from: vi.fn(),
  };
});

const mockStudentSupabase = vi.hoisted(() => {
  const subscription = { unsubscribe: vi.fn() };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription } })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
});

const mockAuthState = vi.hoisted(() => ({
  user: null,
  teacherUser: null,
  viewingStudent: null,
  isViewingStudent: false,
  isLoading: false,
  refreshProfile: vi.fn(),
  viewStudentAccount: vi.fn(),
  returnToTeacherAccount: vi.fn(),
  offlineSignIn: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'test-anon-key',
}));

vi.mock('@/lib/supabase/student-client', () => ({
  studentSupabase: mockStudentSupabase,
}));

vi.mock('@/lib/auth', () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => mockAuthState,
  changeTeacherPassword: vi.fn(),
  requestTeacherPasswordReset: vi.fn(),
  signOut: vi.fn(),
  teacherSignIn: vi.fn(),
  teacherSignUp: vi.fn(),
  validateNewPassword: vi.fn(),
  verifyTeacherPasswordResetOtp: vi.fn(),
  PASSWORD_RESET_OTP_LENGTH: 6,
}));

vi.mock('@/lib/auth/useAuth', () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => mockAuthState,
}));

vi.mock('@features/auth/provider', () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => mockAuthState,
}));

vi.mock('@/lib/offline/classroom/useOfflineClassroom', () => ({
  OfflineClassroomProvider: ({ children }: { children: unknown }) => children,
  useOfflineClassroom: () => ({
    status: 'online',
    pendingCount: 0,
    failedCount: 0,
    syncNow: vi.fn(),
  }),
}));

describe('application bootstrap', () => {
  afterEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
  });

  it('renders the public landing route when no session exists', async () => {
    const { default: App } = await import('./App');

    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /make math your next/i })).toBeInTheDocument();
    });
  });
});
