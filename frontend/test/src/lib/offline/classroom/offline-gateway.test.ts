import { assertEquals } from 'jsr:@std/assert';
import { createOfflineAwareApi } from '../../../../../src/lib/offline/classroom/index.ts';

Deno.test('offline assignment reads use the local API without calling Supabase', async () => {
  let onlineCalls = 0;
  const gateway = createOfflineAwareApi({
    isOnline: () => false,
    onlineApi: {
      assignments: { list: async () => { onlineCalls += 1; return { assignments: [] }; } },
    },
    localApi: {
      assignments: { list: async () => ({ assignments: [{ id: 'local-assignment' }] }) },
    },
  });

  assertEquals(await gateway.assignments.list(), {
    assignments: [{ id: 'local-assignment' }],
  });
  assertEquals(onlineCalls, 0);
});
