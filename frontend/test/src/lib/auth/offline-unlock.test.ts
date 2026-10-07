import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../src/lib/offline/classroom/memoryStore.ts';

Deno.env.set('VITE_SUPABASE_URL', 'https://example.supabase.co');
Deno.env.set('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const { enrollOfflineDevice, offlineSignIn } = await import('../../../../src/lib/auth/auth.ts');

Deno.test('offline sign-in returns the enrolled teacher for the correct password', async () => {
  const store = createMemoryStore();
  await enrollOfflineDevice(
    { id: 'teacher-1', role: 'teacher', full_name: 'Teacher' },
    'secret',
    store,
  );

  const profile = await offlineSignIn('secret', store);
  assertEquals(profile.id, 'teacher-1');
  assertEquals(profile.role, 'teacher');
  await assertRejects(() => offlineSignIn('wrong', store), Error, 'Incorrect offline password.');
});
