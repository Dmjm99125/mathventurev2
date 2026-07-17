import { supabase } from './supabase';

export type Role = 'student' | 'teacher';

export interface TeacherClassSummary {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  studentCount: number;
}

export interface StudentClassSummary {
  id: string;
  name: string;
  teacherName: string;
  joinedAt: string;
}

export interface RosterStudent {
  id: string;
  fullName: string;
  joinedAt: string;
  lessonsCompleted: number;
  averageScorePct: number | null;
  lastActive: string | null;
}

export interface AssignmentForStudent {
  id: string;
  lessonId: string;
  dueAt: string | null;
  createdAt: string;
  completed: boolean;
}

export interface AssignmentForTeacher {
  id: string;
  lessonId: string;
  classId: string | null;
  className: string | null;
  studentId: string | null;
  dueAt: string | null;
  createdAt: string;
}

export interface ClassPost {
  id: string;
  classId: string;
  content: string;
  createdAt: string;
  authorName: string;
}

export interface StudentDashboard {
  completedLessons: number;
  streakDays: number;
  recentAttempts: {
    lessonId: string;
    score: number;
    maxScore: number;
    completedAt: string;
  }[];
}

export interface TeacherDashboard {
  classCount: number;
  studentCount: number;
  classes: {
    id: string;
    name: string;
    studentCount: number;
    attemptCount: number;
    averageScorePct: number | null;
  }[];
  strugglingLessons: { lessonId: string; attempts: number; averageScorePct: number }[];
}

// Thin wrapper around supabase.functions.invoke -- every app data operation
// goes through this, which calls a Supabase Edge Function running with the
// service role key. The browser never queries app tables directly.
export async function invokeFunction<T>(
  name: string,
  options?: { method?: 'GET' | 'POST'; body?: Record<string, unknown>; searchParams?: Record<string, string> },
): Promise<T> {
  const query = options?.searchParams
    ? `?${new URLSearchParams(options.searchParams).toString()}`
    : '';
  const { data, error } = await supabase.functions.invoke(`${name}${query}`, {
    method: options?.method ?? 'GET',
    body: options?.body,
  });
  if (error) {
    const message = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context
      ? await (error as any).context.json().then((j: any) => j?.error).catch(() => undefined)
      : undefined;
    throw new Error(message ?? error.message ?? 'Request failed');
  }
  return data as T;
}

export const api = {
  classes: {
    list: () => invokeFunction<{ classes: (TeacherClassSummary | StudentClassSummary)[] }>('classes-list'),
    create: (name: string) =>
      invokeFunction<{ class: TeacherClassSummary }>('classes-create', { method: 'POST', body: { name } }),
    join: (joinCode: string) =>
      invokeFunction<{ class: { id: string; name: string } }>('classes-join', {
        method: 'POST',
        body: { joinCode },
      }),
    roster: (classId: string) =>
      invokeFunction<{ students: RosterStudent[] }>('classes-roster', { searchParams: { classId } }),
  },
  assignments: {
    list: (classId?: string) =>
      invokeFunction<{ assignments: (AssignmentForStudent | AssignmentForTeacher)[] }>('assignments-list', {
        searchParams: classId ? { classId } : undefined,
      }),
    create: (input: { lessonId: string; classId?: string; studentId?: string; dueAt?: string }) =>
      invokeFunction<{ assignment: unknown }>('assignments-create', { method: 'POST', body: input }),
  },
  attempts: {
    submit: (input: {
      lessonId: string;
      assignmentId?: string;
      score: number;
      maxScore: number;
      durationSeconds?: number;
    }) => invokeFunction<{ attempt: unknown }>('attempts-submit', { method: 'POST', body: input }),
  },
  dashboard: {
    student: () => invokeFunction<StudentDashboard>('dashboard-student'),
    teacher: () => invokeFunction<TeacherDashboard>('dashboard-teacher'),
  },
  posts: {
    list: (classId: string) => invokeFunction<{ posts: ClassPost[] }>('posts-list', { searchParams: { classId } }),
    create: (classId: string, content: string) => invokeFunction<{ post: ClassPost }>('posts-create', { method: 'POST', body: { classId, content } }),
  },
};

