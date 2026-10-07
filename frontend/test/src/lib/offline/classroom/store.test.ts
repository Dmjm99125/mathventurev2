import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';

Deno.test('memory offline store isolates records by store and key', async () => {
  const store = createMemoryStore();

  await store.put('meta', { key: 'schema', value: 1 });
  await store.put('profiles', { key: 'teacher-1', value: { role: 'teacher' } });

  assertEquals(await store.get('meta', 'schema'), { key: 'schema', value: 1 });
  assertEquals(await store.get('profiles', 'schema'), undefined);
  assertEquals(await store.getAll('profiles'), [
    { key: 'teacher-1', value: { role: 'teacher' } },
  ]);
});
