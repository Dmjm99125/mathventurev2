import { assertEquals } from 'jsr:@std/assert';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createTestOfflineClassroom } from '../../../../../src/lib/offline/classroom/index.ts';

const snapshot = {
  revision: 1,
  teacher: { id: 'teacher-1', role: 'teacher' as const, fullName: 'Teacher' },
  classroom: { id: 'class-1', teacher_id: 'teacher-1', name: 'Classroom' },
  students: [],
  assignments: [],
  attempts: [],
  gameResults: [],
  posts: [],
  freePlaySessions: [],
  freePlayProgress: [],
};

Deno.test('application remains usable after network failure and reload', async () => {
  const database = await createMemorySqlite();
  const first = createTestOfflineClassroom({ store: database, snapshot });
  await first.bootstrapNow();
  await first.createAssignment('teacher-1', { lessonId: 'lesson-1', name: 'Practice', classId: 'class-1' }, () => 'assignment-local-1');

  const reloaded = createOfflineRepository(database, undefined, undefined, 'local-device');
  assertEquals((await reloaded.readCollection('assignments')).at(-1)?.name, 'Practice');
  assertEquals((await reloaded.getSyncSummary()).pendingCount, 1);

  await first.syncNow(async (operations) => operations.map((operation) => ({
    operationId: operation.operationId,
    status: 'accepted' as const,
    result: { assignment: { id: operation.entityId } },
  })));
  assertEquals((await reloaded.getSyncSummary()).pendingCount, 0);
});
