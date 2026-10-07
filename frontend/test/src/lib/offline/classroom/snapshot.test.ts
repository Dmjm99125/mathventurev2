import { assertEquals } from 'jsr:@std/assert';
import { mergeOfflineSnapshot } from '../../../../../src/lib/offline/classroom/snapshot.ts';

Deno.test('snapshot merge preserves local entities referenced by pending operations', () => {
  const result = mergeOfflineSnapshot(
    { revision: 2, assignments: [{ id: 'server-assignment', name: 'Server' }] },
    { assignments: [{ id: 'local-assignment', name: 'Local' }] },
    [{ entityId: 'local-assignment', status: 'pending' }],
  );

  assertEquals(result.assignments.map((row) => row.id), ['server-assignment', 'local-assignment']);
});
