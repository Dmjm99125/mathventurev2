import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { createTauriFreePlayOfflineClient } from '../../../../src/lib/offline/tauriFreePlayOfflineClient.ts';

Deno.test('bundled media client becomes ready from the packaged manifest', async () => {
  const client = createTauriFreePlayOfflineClient({
    fetchManifest: async () => ({
      schemaVersion: 1,
      version: 'v1',
      totalFiles: 1,
      totalBytes: 5,
      entries: [{ url: '/assets/free-play/a.json', bytes: 5 }],
    }),
  });

  const status = await client.getStatus();
  assertEquals(status.state, 'ready');
  assertEquals(status.completedFiles, 1);
  assertEquals(await client.checkForUpdate(), status);
  await client.cancel();
  client.dispose();
});

Deno.test('bundled media client rejects an invalid packaged manifest', async () => {
  const client = createTauriFreePlayOfflineClient({ fetchManifest: async () => ({ version: 'bad' }) });
  await assertRejects(() => client.getStatus(), Error, 'manifest is invalid');
});
