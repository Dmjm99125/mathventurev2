import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';

Deno.env.set('VITE_SUPABASE_URL', 'https://example.supabase.co');
Deno.env.set('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const { readOfflineStudentProfile } = await import('../../../../../src/lib/auth/auth.ts');

Deno.test('cached student switching returns the selected roster profile', async () => {
  const store = createMemoryStore();
  await store.put('profiles', {
    key: 'student-1',
    value: { id: 'student-1', role: 'student', full_name: 'Ana Santos' },
  });
  assertEquals(await readOfflineStudentProfile('student-1', store), {
    id: 'student-1', role: 'student', full_name: 'Ana Santos',
  });
});
