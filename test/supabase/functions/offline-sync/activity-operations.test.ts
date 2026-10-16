import { assertEquals } from 'jsr:@std/assert';
import {
  createActivityOperationApplier,
  type ActivityOperationPersistence,
} from '../../../../supabase/functions/_shared/offline_operations.ts';

const base = {
  operationId: 'operation-1',
  deviceId: 'device-1',
  actorId: 'student-1',
  entityId: 'attempt-1',
  dependencies: [],
  createdAt: '2026-10-07T00:00:00.000Z',
};

Deno.test('attempt.submit requires a positive max score and valid detailed results', async () => {
  const persistence: ActivityOperationPersistence = {
    resolveAttemptClassId: async () => 'class-1',
    insertAttempt: async (input) => ({ ...input }),
    insertAttemptGameResults: async () => {},
    isTeacherForClass: async () => true,
    insertPost: async (input) => input,
  };
  const apply = createActivityOperationApplier(persistence);

  const invalidMax = await apply('student-1', {
    ...base,
    type: 'attempt.submit',
    payload: { lessonId: 'lesson-1', score: 0, maxScore: 0, gameResults: [] },
  });
  const invalidResults = await apply('student-1', {
    ...base,
    operationId: 'operation-2',
    payload: {
      lessonId: 'lesson-1',
      score: 1,
      maxScore: 2,
      gameResults: [{ topicId: 'lesson-1', gameId: '', gameOrder: 0, score: 1, maxScore: 2 }],
    },
    type: 'attempt.submit',
  });

  assertEquals(invalidMax, { status: 'rejected', error: 'score and maxScore must be valid numbers.' });
  assertEquals(invalidResults, { status: 'rejected', error: 'gameResults must contain valid detailed game rows.' });
});

Deno.test('duplicate attempt submission is accepted without inserting a second attempt', async () => {
  let inserted = 0;
  const persistence: ActivityOperationPersistence = {
    resolveAttemptClassId: async () => 'class-1',
    readAttempt: async () => ({ id: 'attempt-1', score: 8, max_score: 10 }),
    insertAttempt: async (input) => { inserted += 1; return { ...input }; },
    insertAttemptGameResults: async () => {},
    isTeacherForClass: async () => true,
    insertPost: async (input) => input,
  };
  const result = await createActivityOperationApplier(persistence)('student-1', {
    ...base,
    type: 'attempt.submit',
    payload: { lessonId: 'lesson-1', score: 8, maxScore: 10, gameResults: [] },
  });
  assertEquals(inserted, 0);
  assertEquals(result, { status: 'accepted', result: { duplicate: true, attempt: { id: 'attempt-1', score: 8, max_score: 10 } } });
});
