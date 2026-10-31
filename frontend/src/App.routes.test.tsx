import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

function Marker({ name }: { name: string }) {
  return <div data-testid={name}>{name}</div>;
}

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

vi.mock('@/lib/offline/classroom/useOfflineClassroom', () => ({
  OfflineClassroomProvider: ({ children }: { children: unknown }) => children,
  useOfflineClassroom: () => ({ status: 'online', pendingCount: 0, failedCount: 0, syncNow: vi.fn() }),
}));

vi.mock('@/components/layout', () => ({
  AppLayout: ({ children }: { children: unknown }) => <>{children}</>,
}));

vi.mock('@/pages/free-play', () => ({ FreePlay: () => <Marker name="free-play" /> }));
vi.mock('@features/public-site/pages', () => ({
  About: () => <Marker name="about" />,
  Landing: () => <Marker name="landing" />,
  NotFound: () => <Marker name="not-found" />,
  ForgotPassword: () => <Marker name="forgot-password" />,
  Login: () => <Marker name="login" />,
  PasswordReset: () => <Marker name="reset-password" />,
  Signup: () => <Marker name="signup" />,
}));
vi.mock('@features/student/pages', () => ({
  StudentDashboard: () => <Marker name="student-dashboard" />,
  StudentClassroomPage: () => <Marker name="student-classroom" />,
}));
vi.mock('@features/teacher/pages', () => ({
  TeacherTodayPage: () => <Marker name="teacher-today" />,
  TeacherStudentsPage: () => <Marker name="teacher-students" />,
  TeacherAssignmentsPage: () => <Marker name="teacher-assignments" />,
  TeacherReportsPage: () => <Marker name="teacher-reports" />,
  TeacherSettingsPage: () => <Marker name="teacher-settings" />,
  TeacherClassesPage: () => <Marker name="teacher-classes" />,
  TeacherClassWorkspacePage: () => <Marker name="teacher-class-workspace" />,
}));
vi.mock('@/pages/QuizPage', () => ({ QuizPage: () => <Marker name="quiz" /> }));

describe('application route contracts', () => {
  let App: ComponentType;

  beforeAll(async () => {
    ({ default: App } = await import('./App'));
  });

  afterEach(() => {
    cleanup();
  });

  const cases = [
    ['/', 'landing'],
    ['/free-play', 'free-play'],
    ['/about', 'about'],
    ['/login', 'login'],
    ['/signup', 'signup'],
    ['/forgot-password', 'forgot-password'],
    ['/reset-password', 'reset-password'],
    ['/student', 'student-dashboard'],
    ['/student/classroom', 'student-classroom'],
    ['/student/lessons/colors?freePlay=1', 'quiz'],
    ['/teacher', 'teacher-classes'],
    ['/teacher/settings', 'teacher-settings'],
    ['/teacher/classes/class-1', 'teacher-class-workspace'],
    ['/unknown', 'not-found'],
  ] as const;

  it.each(cases)('maps %s to %s', async (path, marker) => {
    window.history.pushState({}, '', path);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId(marker)).toBeInTheDocument();
    });
  });

  it.each([
    ['/student/lessons', 'student-dashboard'],
    ['/student/classes/class-1', 'student-classroom'],
    ['/teacher/students', 'teacher-classes'],
    ['/teacher/assignments', 'teacher-classes'],
    ['/teacher/reports', 'teacher-classes'],
    ['/teacher/classes', 'teacher-classes'],
  ] as const)('preserves the redirect from %s to %s', async (path, marker) => {
    window.history.pushState({}, '', path);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId(marker)).toBeInTheDocument();
    });
  });
});
