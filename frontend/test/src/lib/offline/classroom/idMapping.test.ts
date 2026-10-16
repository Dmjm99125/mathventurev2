import { assertEquals } from 'jsr:@std/assert';
import { remapEntityId } from '../../../../../src/lib/offline/classroom/idMapping.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';

Deno.test('server ID mapping rewrites dependent rows and outbox payloads transactionally', () => {
  const result = remapEntityId({
    entityType: 'student',
    localId: 'student-local-1',
    serverId: 'student-server-1',
    rows: [{ student_id: 'student-local-1', profile: { id: 'student-local-1' } }],
    operations: [{
      operationId: 'op-1',
      deviceId: 'device-1',
      actorId: 'teacher-1',
      type: 'class.addStudents',
      entityId: 'student-local-1',
      payload: { studentId: 'student-local-1' },
      dependencies: [],
      createdAt: '2026-10-16T00:00:00.000Z',
      status: 'pending',
      attemptCount: 0,
      lastError: null,
    }],
  });

  assertEquals(result.rows[0].student_id, 'student-server-1');
  assertEquals((result.rows[0].profile as Record<string, unknown>).id, 'student-server-1');
  assertEquals(result.operations[0].operationId, 'op-1');
  assertEquals(result.operations[0].payload.studentId, 'student-server-1');
});

Deno.test('sqlite repository persists the canonical mapping with rewritten dependent work', async () => {
  const database = await createMemorySqlite();
  const repository = createOfflineRepository(
    database,
    () => '2026-10-16T00:00:00.000Z',
    () => 'op-1',
    'device-1',
  );
  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'class.addStudents',
    entityId: 'student-local-1',
    payload: { studentId: 'student-local-1', classId: 'class-1' },
    dependencies: [],
  });

  await repository.remapEntityId({ entityType: 'student', localId: 'student-local-1', serverId: 'student-server-1' });

  assertEquals((await repository.readByKey('classStudents', 'student-server-1'))?.student_id, 'student-server-1');
  assertEquals((await repository.getOutbox())[0]?.entityId, 'student-server-1');
  assertEquals(await database.query('select server_id from entity_id_mappings where local_id = ?', ['student-local-1']), [
    { server_id: 'student-server-1' },
  ]);
});
