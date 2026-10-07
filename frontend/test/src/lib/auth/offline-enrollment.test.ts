import { assert, assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../src/lib/offline/classroom/memoryStore.ts';

Deno.env.set('VITE_SUPABASE_URL', 'https://example.supabase.co');
Deno.env.set('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const { enrollOfflineDevice, readOfflineEnrollment } = await import('../../../../src/lib/auth/auth.ts');

Deno.test('online enrollment stores profile metadata and a verifier, never the password', async () => {
  const store = createMemoryStore();

  await enrollOfflineDevice(
    { id: 'teacher-1', role: 'teacher', full_name: 'Teacher' },
    'secret',
    store,
  );

  const record = await readOfflineEnrollment(store);
  assert(record?.verifier);
  assertEquals(JSON.stringify(record).includes('secret'), false);
  assertEquals(record?.profile, { id: 'teacher-1', role: 'teacher', full_name: 'Teacher' });
});
