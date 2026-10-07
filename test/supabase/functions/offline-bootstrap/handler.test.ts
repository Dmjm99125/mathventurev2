import { assertEquals } from 'jsr:@std/assert';
import { createOfflineBootstrapHandler } from '../../../../supabase/functions/offline-bootstrap/handler.ts';

Deno.test('offline bootstrap returns the complete teacher classroom pack', async () => {
  const handler = createOfflineBootstrapHandler({
    getAuthedProfile: async () => ({
      id: 'teacher-1',
      role: 'teacher',
      full_name: 'Teacher',
    }),
    getSnapshot: async () => ({
      revision: 4,
      classroom: null,
      students: [],
      assignments: [],
      attempts: [],
      gameResults: [],
      posts: [],
    }),
  });

  const response = await handler(new Request('http://local/offline-bootstrap'));
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.revision, 4);
  assertEquals(body.teacher, { id: 'teacher-1', role: 'teacher', fullName: 'Teacher' });
});

Deno.test('offline bootstrap rejects unauthenticated requests', async () => {
  const handler = createOfflineBootstrapHandler({
    getAuthedProfile: async () => null,
    getSnapshot: async () => { throw new Error('must not query'); },
  });

  const response = await handler(new Request('http://local/offline-bootstrap'));
  assertEquals(response.status, 401);
});
