import type {
  TeacherAddStudentDraft,
  TeacherAddStudentsResult,
} from '../teacher/add-students';
import type {
  TeacherSingleClassroomReportPayload,
  TeacherReportsWindowKey,
} from '../teacher/reports';
import {
  invokeFunction,
} from '@infrastructure/api/transport';
export {
  invokeFunction,
  invokeTeacherFunction,
  resetActiveAuthClient,
  setActiveAuthClient,
} from '@infrastructure/api/transport';
export type {
  AuthClient,
  InvokeFunctionOptions,
} from '@infrastructure/api/transport';

export type Role = 'student' | 'teacher';

export interface PageInfo {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface TeacherClassSummary {
  id: string;
  name: string;
  createdAt: string;
  archivedAt: string | null;
  studentCount: number;
}

export interface TeacherClassesListResponse {
  classes: TeacherClassSummary[];
  archivedClasses: TeacherClassSummary[];
}

export type TeacherClassroomSummary = TeacherClassSummary;

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

export const api = {
  classes: {
    list: () =>
      invokeFunction<{
        classes?: TeacherClassSummary[];
        archivedClasses?: TeacherClassSummary[];
        classroom?: TeacherClassroomSummary | StudentClassroomSummary | null;
      }>('classes-list'),
    create: (name: string) =>
      invokeFunction<{ classroom: TeacherClassSummary }>('classes-create', {
        method: 'POST',
        body: { name },
      }),
    update: (input: { classId: string; action: 'rename' | 'archive' | 'unarchive'; name?: string }) =>
      invokeFunction<{ classroom: TeacherClassSummary }>('classes-update', {
        method: 'POST',
        body: input,
      }),
    join: (joinCode?: string) =>
      invokeFunction<unknown>('classes-join', {
        method: 'POST',
        body: joinCode ? { joinCode } : undefined,
      }),
    roster: (classId: string, options?: { cursor?: string | null; pageSize?: number }) =>
      invokeFunction<{ students: TeacherClassStudent[]; page: PageInfo }>('classes-roster', {
        searchParams: {
          classId,
          ...(options?.pageSize ? { pageSize: String(options.pageSize) } : {}),
          ...(options?.cursor ? { cursor: options.cursor } : {}),
        },
      }),
    rosterStudent: (classId: string, studentId: string) =>
      invokeFunction<{ students: TeacherClassStudent[]; page: PageInfo }>('classes-roster', {
        searchParams: { classId, studentId },
      }),
    addStudents: (classId: string, students: TeacherAddStudentDraft[]) =>
      invokeFunction<TeacherAddStudentsResult>('classes-add-students', {
        method: 'POST',
        body: { classId, students },
      }),
    removeStudent: (classId: string, studentId: string) =>
      invokeFunction<{ removed: true }>('classes-remove-student', {
        method: 'POST',
        body: { classId, studentId },
      }),
  },
  assignments: {
    list: (classId?: string, options?: { cursor?: string | null; pageSize?: number }) =>
      invokeFunction<{
        assignments: (AssignmentForStudent | AssignmentForTeacher)[];
        page: PageInfo;
      }>('assignments-list', {
        searchParams: {
          ...(classId ? { classId } : {}),
          ...(options?.pageSize ? { pageSize: String(options.pageSize) } : {}),
          ...(options?.cursor ? { cursor: options.cursor } : {}),
        },
      }),
    create: (input: { lessonId: string; name?: string; classId?: string; studentId?: string; dueAt?: string }) =>
      invokeFunction<{ assignment: unknown }>('assignments-create', { method: 'POST', body: input }),
    update: (input: { assignmentId: string; lessonId: string; name?: string; dueAt?: string | null }) =>
      invokeFunction<{ assignment: unknown }>('assignments-update', { method: 'POST', body: input }),
    delete: (assignmentId: string) =>
      invokeFunction<{ deleted: true }>('assignments-delete', {
        method: 'POST',
        body: { assignmentId },
      }),
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
    overview: (classId: string, window: TeacherReportsWindowKey, options?: { studentCursor?: string | null; pageSize?: number }) =>
      invokeFunction<TeacherSingleClassroomReportPayload>('reports-overview', {
        searchParams: {
          classId,
          window,
          ...(options?.studentCursor ? { cursor: options.studentCursor } : {}),
          ...(options?.pageSize ? { pageSize: String(options.pageSize) } : {}),
        },
      }),
    classDetail: (classId: string, window: TeacherReportsWindowKey, options?: { studentCursor?: string | null; pageSize?: number }) =>
      invokeFunction<TeacherSingleClassroomReportPayload>('reports-class', {
        searchParams: {
          classId,
          window,
          ...(options?.studentCursor ? { cursor: options.studentCursor } : {}),
          ...(options?.pageSize ? { pageSize: String(options.pageSize) } : {}),
        },
      }),
  },
};

