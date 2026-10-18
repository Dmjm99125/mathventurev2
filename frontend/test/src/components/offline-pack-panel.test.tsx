import { assertMatch } from 'jsr:@std/assert';

Deno.test('offline pack panel exposes refresh and sync controls', async () => {
  const source = await Deno.readTextFile(
    new URL('../../../src/components/offline/OfflinePackPanel.tsx', import.meta.url),
  );
  assertMatch(source, /Refresh classroom pack/);
  assertMatch(source, /download automatically when you sign in/);
  assertMatch(source, /Sync now/);
  assertMatch(source, /pending/);
  assertMatch(source, /requires an internet connection/);
  assertMatch(source, /leaseExpiresAt/);
  assertMatch(source, /Storage:/);
});
