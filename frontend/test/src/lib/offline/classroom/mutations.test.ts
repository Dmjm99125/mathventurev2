import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createOfflineAssignment } from '../../../../../src/lib/offline/classroom/mutations.ts';

Deno.test('offline assignment mutation returns a local ID and pending sync state', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  const result = await createOfflineAssignment(repository, 'teacher-1', {
    lessonId: 'lesson-1',
    name: 'Offline colors',
    classId: 'class-1',
  }, () => 'assignment-local-1');

  assertEquals(result, {
    id: 'assignment-local-1',
    syncState: 'pending',
  });
  assertEquals((await repository.readCollection('assignments'))[0].name, 'Offline colors');
});
