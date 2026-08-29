import { supabase } from '../supabase/client';
import type {
  TeacherAddStudentDraft,
  TeacherAddStudentsResult,
} from '../teacher/add-students';
import type {
  TeacherSingleClassroomReportPayload,
  TeacherReportsWindowKey,
} from '../teacher/reports';

export type Role = 'student' | 'teacher';

export interface TeacherClassroomSummary {
  id: string;
  createdAt: string;
  studentCount: number;
}

export interface AttemptGameResultInput {
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  completedAt?: string;
}

export interface StudentClassroomSummary {
  id: string;
  teacherName: string;
  joinedAt: string;
}

export interface TeacherClassSummary extends TeacherClassroomSummary {
  name: string;
  joinCode: string;
}

export interface StudentClassSummary extends StudentClassroomSummary {
  name: string;
}

export interface TeacherGameScore {
  gameId: string;
  score: number;
  maxScore: number;
  scorePct: number;
  completedAt: string;
}

export interface TeacherAssignmentScore {
  assignmentId: string;
  name: string;
  lessonId: string;
  dueAt: string | null;
  createdAt: string;
  status: AssignmentQuizStatus;
  overallScore: number | null;
  overallMaxScore: number | null;
  overallScorePct: number | null;
  gameScores: TeacherGameScore[];
}

export interface TeacherClassStudent {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  joinedAt: string;
  appCompletionPct: number | null;
  lastPlayedPct: number | null;
  overallScore: number | null;
  overallMaxScore: number | null;
  overallScorePct: number | null;
  gameScores: TeacherGameScore[];
  assignments: TeacherAssignmentScore[];
}

export interface AssignmentForStudent {
  id: string;
  name: string;
  lessonId: string;
  classId: string | null;
  dueAt: string | null;
  createdAt: string;
  status: AssignmentQuizStatus;
  currentGameOrder: number;
  score: number;
  maxScore: number;
  completed: boolean;
}

export type AssignmentQuizStatus = 'not_started' | 'in_progress' | 'completed';

export interface AssignmentQuizState {
  status: AssignmentQuizStatus;
  assignmentId: string;
  lessonId: string;
  attemptId: string | null;
  currentGameOrder: number;
  score: number;
  maxScore: number;
  gameResults: AttemptGameResultInput[];
  completedAt: string | null;
}

export interface AssignmentForTeacher {
  id: string;
  name: string;
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
    list: () =>
      invokeFunction<{
        classroom: TeacherClassroomSummary | StudentClassroomSummary | null;
      }>('classes-list'),
    create: (name?: string) =>
      invokeFunction<{ classroom: TeacherClassroomSummary }>('classes-create', {
        method: 'POST',
        body: name ? { name } : undefined,
      }),
    join: (joinCode?: string) =>
      invokeFunction<unknown>('classes-join', {
        method: 'POST',
        body: joinCode ? { joinCode } : undefined,
      }),
    roster: () =>
      invokeFunction<{ students: TeacherClassStudent[] }>('classes-roster'),
    addStudents: (students: TeacherAddStudentDraft[]) =>
      invokeFunction<TeacherAddStudentsResult>('classes-add-students', {
        method: 'POST',
        body: { students },
      }),
    removeStudent: (studentId: string) =>
      invokeFunction<{ removed: true }>('classes-remove-student', {
        method: 'POST',
        body: { studentId },
      }),
  },
  assignments: {
    list: (classId?: string) =>
      invokeFunction<{ assignments: (AssignmentForStudent | AssignmentForTeacher)[] }>('assignments-list', {
        searchParams: classId ? { classId } : undefined,
      }),
    create: (input: { lessonId: string; name?: string; classId?: string; studentId?: string; dueAt?: string }) =>
      invokeFunction<{ assignment: unknown }>('assignments-create', { method: 'POST', body: input }),
  },
  assignmentQuiz: {
    get: (assignmentId: string, lessonId: string) =>
      invokeFunction<{ state: AssignmentQuizState }>('assignment-quiz', {
        searchParams: { assignmentId, lessonId },
      }),
    start: (assignmentId: string, lessonId: string) =>
      invokeFunction<{ state: AssignmentQuizState }>('assignment-quiz', {
        method: 'POST',
        body: { action: 'start', assignmentId, lessonId },
      }),
    checkpoint: (input: {
      assignmentId: string;
      lessonId: string;
      score: number;
      gameResult: AttemptGameResultInput;
    }) =>
      invokeFunction<{ state: AssignmentQuizState }>('assignment-quiz', {
        method: 'POST',
        body: { action: 'checkpoint', ...input },
      }),
    complete: (input: {
      assignmentId: string;
      lessonId: string;
      score: number;
      maxScore: number;
      durationSeconds?: number;
      gameResults: AttemptGameResultInput[];
    }) =>
      invokeFunction<{ state: AssignmentQuizState }>('assignment-quiz', {
        method: 'POST',
        body: { action: 'complete', ...input },
      }),
  },
  attempts: {
    submit: (input: {
      lessonId: string;
      assignmentId?: string;
      classId?: string;
      score: number;
      maxScore: number;
      durationSeconds?: number;
      gameResults?: AttemptGameResultInput[];
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
  reports: {
    overview: (window: TeacherReportsWindowKey) =>
      invokeFunction<TeacherSingleClassroomReportPayload>('reports-overview', {
        searchParams: { window },
      }),
    classDetail: (classId: string, window: TeacherReportsWindowKey) =>
      invokeFunction<TeacherSingleClassroomReportPayload>('reports-class', {
        searchParams: { classId, window },
      }),
  },
};

