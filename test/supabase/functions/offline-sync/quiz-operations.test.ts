import { assertEquals } from 'jsr:@std/assert';
import {
  createAssignmentQuizOperationApplier,
  type AssignmentQuizOperationPersistence,
} from '../../../../supabase/functions/_shared/offline_operations.ts';

const baseOperation = {
  operationId: 'operation-1',
  deviceId: 'device-1',
  actorId: 'student-1',
  entityId: 'attempt-1',
  dependencies: [],
  createdAt: '2026-10-07T00:00:00.000Z',
};

Deno.test('assignment quiz checkpoints reject out-of-order progress and deduplicate prior games', async () => {
  const attempt = {
    id: 'attempt-1',
    student_id: 'student-1',
    assignment_id: 'assignment-1',
    lesson_id: 'lesson-1',
    status: 'in_progress' as const,
    current_game_order: 1,
    score: 4,
    max_score: 5,
  };
  const persistence: AssignmentQuizOperationPersistence = {
    getAssignmentContext: async () => ({ lessonId: 'lesson-1', classId: 'class-1', studentId: null }),
    isStudentEnrolledInClass: async () => true,
    getAttempt: async () => attempt,
    createAttempt: async () => attempt,
    updateAttempt: async () => attempt,
    listGameResults: async () => [{ topicId: 'lesson-1', gameId: 'lesson-1:0', gameOrder: 0, score: 4, maxScore: 5 }],
    upsertGameResult: async () => {},
  };
  const apply = createAssignmentQuizOperationApplier(persistence);

  const outOfOrder = await apply('student-1', {
    ...baseOperation,
    type: 'assignmentQuiz.checkpoint',
    payload: {
      assignmentId: 'assignment-1',
      lessonId: 'lesson-1',
      gameResult: { topicId: 'lesson-1', gameId: 'lesson-1:2', gameOrder: 2, score: 1, maxScore: 1 },
      score: 5,
    },
  });
  const duplicate = await apply('student-1', {
    ...baseOperation,
    operationId: 'operation-2',
    type: 'assignmentQuiz.checkpoint',
    payload: {
      assignmentId: 'assignment-1',
      lessonId: 'lesson-1',
      gameResult: { topicId: 'lesson-1', gameId: 'lesson-1:0', gameOrder: 0, score: 4, maxScore: 5 },
      score: 4,
    },
  });

  assertEquals(outOfOrder, { status: 'rejected', error: 'Checkpoint is out of order.' });
  assertEquals(duplicate, { status: 'accepted', result: { duplicate: true, attemptId: 'attempt-1' } });
});
