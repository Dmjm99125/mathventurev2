import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import {
  checkpointOfflineAssignmentQuiz,
  startOfflineAssignmentQuiz,
} from '../../../../../src/lib/offline/classroom/quiz.ts';

Deno.test('offline assignment quiz checkpoints persist the next game order', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  await repository.putSnapshot('assignments', [{
    id: 'assignment-1', lesson_id: 'lesson-1', class_id: 'class-1', student_id: 'student-1',
  }]);
  const started = await startOfflineAssignmentQuiz(repository, 'student-1', 'assignment-1', 'lesson-1', () => 'attempt-1');
  await checkpointOfflineAssignmentQuiz(repository, 'student-1', {
    attemptId: started.attemptId,
    assignmentId: 'assignment-1',
    lessonId: 'lesson-1',
    score: 1,
    gameResult: { topicId: 'lesson-1', gameId: 'lesson-1:0', gameOrder: 0, score: 1, maxScore: 1 },
  });

  const attempt = (await repository.readCollection('attempts'))[0];
  assertEquals(attempt.currentGameOrder, 1);
  assertEquals(attempt.status, 'in_progress');
});
