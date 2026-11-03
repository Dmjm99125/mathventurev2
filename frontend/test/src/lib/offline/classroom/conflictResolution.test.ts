import { assertEquals } from 'jsr:@std/assert@1';
import { resolveOfflineConflict } from '@/lib/offline/classroom/conflictResolution.ts';

Deno.test('server conflict resolution refreshes the local snapshot', async () => {
  const events: string[] = [];

  await resolveOfflineConflict(
    {
      resolveConflict: async (key, choice) => {
        events.push(`resolve:${key}:${choice}`);
      },
    },
    async () => {
      events.push('bootstrap');
    },
    'conflict-1',
    'server',
  );

  assertEquals(events, ['resolve:conflict-1:server', 'bootstrap']);
});

Deno.test('local conflict resolution does not replace the optimistic snapshot', async () => {
  const events: string[] = [];

  await resolveOfflineConflict(
    {
      resolveConflict: async (key, choice) => {
        events.push(`resolve:${key}:${choice}`);
      },
    },
    async () => {
      events.push('bootstrap');
    },
    'conflict-2',
    'local',
  );

  assertEquals(events, ['resolve:conflict-2:local']);
});
