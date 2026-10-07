import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createTestOfflineClassroom } from '../../../../../src/lib/offline/classroom/index.ts';

Deno.test('offline classroom round trip clears an acknowledged assignment', async () => {
  const flow = createTestOfflineClassroom({
    repository: undefined,
    snapshot: {
      revision: 1,
      teacher: { id: 'teacher-1', role: 'teacher', fullName: 'Teacher' },
      classroom: { id: 'class-1', name: 'Classroom' },
      students: [], assignments: [], attempts: [], gameResults: [], posts: [],
    },
    store: createMemoryStore(),
  });
  await flow.bootstrapNow();
  await flow.createAssignment('teacher-1', { lessonId: 'lesson-1', name: 'Colors', classId: 'class-1' }, () => 'assignment-1');
  assertEquals((await flow.repository.getSyncSummary()).pendingCount, 1);
  await flow.syncNow(async (operations) => operations.map((operation) => ({ operationId: operation.operationId, status: 'accepted' as const })));
  assertEquals(await flow.repository.getSyncSummary(), { pendingCount: 0, failedCount: 0 });
});
