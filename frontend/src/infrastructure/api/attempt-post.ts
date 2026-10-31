import type { AttemptGameResultInput, ClassPost } from '@/lib/api/client';
import { invokeFunction } from './transport';

export const attemptApi = {
  submit: (input: {
    lessonId: string;
    assignmentId?: string;
    classId?: string;
    score: number;
    maxScore: number;
    durationSeconds?: number;
    gameResults?: AttemptGameResultInput[];
  }) => invokeFunction<{ attempt: unknown }>('attempts-submit', { method: 'POST', body: input }),
};

export const postApi = {
  list: (classId: string) =>
    invokeFunction<{ posts: ClassPost[] }>('posts-list', {
      searchParams: { classId },
    }),

  create: (classId: string, content: string) =>
    invokeFunction<{ post: ClassPost }>('posts-create', {
      method: 'POST',
      body: { classId, content },
    }),
};
