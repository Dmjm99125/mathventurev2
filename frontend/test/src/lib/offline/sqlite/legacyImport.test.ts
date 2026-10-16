import { assertEquals } from 'jsr:@std/assert';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import type { OfflineStore } from '../../../../../src/lib/offline/classroom/store.ts';
import { importLegacyClassroomDatabase } from '../../../../../src/lib/offline/sqlite/legacyImport.ts';

async function createLegacyFixture(): Promise<OfflineStore> {
  const store = createMemoryStore();
  await store.put('profiles', {
      key: 'teacher-1',
      value: { id: 'teacher-1', role: 'teacher', full_name: 'Teacher One' },
  });
  await store.put('classrooms', {
      key: 'class-1',
      value: { id: 'class-1', teacher_id: 'teacher-1', name: 'Room 1' },
  });
  await store.put('outbox', {
      key: 'op-1',
      value: {
        operationId: 'op-1',
        deviceId: 'device-1',
        actorId: 'teacher-1',
        type: 'assignment.create',
        entityId: 'assignment-1',
        payload: { name: 'Practice' },
        dependencies: [],
        createdAt: '2026-10-16T00:00:00.000Z',
        status: 'pending',
        attemptCount: 0,
        lastError: null,
      },
  });
  await store.put('outbox', {
      key: 'op-2',
      value: {
        operationId: 'op-2',
        deviceId: 'device-1',
        actorId: 'teacher-1',
        type: 'post.create',
        entityId: 'post-1',
        payload: { content: 'Hello' },
        dependencies: [],
        createdAt: '2026-10-16T00:01:00.000Z',
        status: 'failed',
        attemptCount: 2,
        lastError: 'network unavailable',
      },
  });
  return store;
}

Deno.test('legacy import copies entities and preserves every unsynced outbox operation', async () => {
  const source = await createLegacyFixture();
  const target = await createMemorySqlite();

  await importLegacyClassroomDatabase(target, source, () => '2026-10-16T01:00:00.000Z');

  assertEquals((await target.query('select id from profiles order by id')).length, 1);
  assertEquals((await target.query('select id from classrooms order by id')).length, 1);
  assertEquals((await target.query('select operation_id from sync_outbox order by operation_id')).length, 2);
  assertEquals((await target.query('select status from sync_outbox order by operation_id')).map((row) => row.status), ['pending', 'failed']);
  assertEquals((await target.query('select value from app_meta where key = ?', ['legacy-idb-migrated'])).length, 1);
});

Deno.test('legacy import is idempotent and never deletes the source store', async () => {
  const source = await createLegacyFixture();
  const target = await createMemorySqlite();

  await importLegacyClassroomDatabase(target, source, () => '2026-10-16T01:00:00.000Z');
  await importLegacyClassroomDatabase(target, source, () => '2026-10-16T02:00:00.000Z');

  assertEquals((await target.query('select operation_id from sync_outbox order by operation_id')).map((row) => row.operation_id), ['op-1', 'op-2']);
  assertEquals((await source.get('profiles', 'teacher-1'))?.key, 'teacher-1');
  assertEquals((await target.query('select value from app_meta where key = ?', ['legacy-idb-migrated'])).length, 1);
});
