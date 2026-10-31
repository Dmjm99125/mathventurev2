import type {
  AssignmentForStudent,
  AssignmentForTeacher,
  AssignmentQuizState,
  AttemptGameResultInput,
  PageInfo,
} from '@/lib/api/client';
import { invokeFunction } from './transport';

export const assignmentApi = {
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
    invokeFunction<{ assignment: unknown }>('assignments-create', {
      method: 'POST',
      body: input,
    }),

  update: (input: { assignmentId: string; lessonId: string; name?: string; dueAt?: string | null }) =>
    invokeFunction<{ assignment: unknown }>('assignments-update', {
      method: 'POST',
      body: input,
    }),

  delete: (assignmentId: string) =>
    invokeFunction<{ deleted: true }>('assignments-delete', {
      method: 'POST',
      body: { assignmentId },
    }),

  quiz: {
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
};
