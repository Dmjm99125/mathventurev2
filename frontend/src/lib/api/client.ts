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
import { classroomApi } from '@infrastructure/api/classroom';
import { assignmentApi } from '@infrastructure/api/assignment';
import { dashboardApi, reportApi } from '@infrastructure/api/dashboard-report';
import { attemptApi, postApi } from '@infrastructure/api/attempt-post';
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
  classes: classroomApi,
  assignments: assignmentApi,
  assignmentQuiz: assignmentApi.quiz,
  attempts: attemptApi,
  dashboard: dashboardApi,
  posts: postApi,
  reports: reportApi,
};

