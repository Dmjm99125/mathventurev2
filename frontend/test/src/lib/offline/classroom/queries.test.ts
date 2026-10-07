import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import {
  buildOfflinePage,
  isClassroomDataReady,
  readOfflineAssignments,
} from '../../../../../src/lib/offline/classroom/queries.ts';

Deno.test('cached classroom queries stay enabled for an offline enrolled profile', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  await repository.putSnapshot('assignments', [{
    id: 'assignment-1',
    name: 'Colors',
    lesson_id: 'lesson-1',
    class_id: 'class-1',
    due_at: null,
    created_at: '2026-10-07T00:00:00.000Z',
  }]);

  assertEquals(isClassroomDataReady({ isLoading: false, user: null, offlineProfile: { id: 'student-1' } }), true);
  assertEquals(await readOfflineAssignments(repository, 'student-1'), [{
    id: 'assignment-1',
    name: 'Colors',
    lessonId: 'lesson-1',
    classId: 'class-1',
    dueAt: null,
    createdAt: '2026-10-07T00:00:00.000Z',
    status: 'not_started',
    currentGameOrder: 0,
    score: 0,
    maxScore: 0,
    completed: false,
  }]);
  assertEquals(buildOfflinePage([{ id: 'one' }]), {
    items: [{ id: 'one' }],
    page: { nextCursor: null, hasMore: false },
  });
});
