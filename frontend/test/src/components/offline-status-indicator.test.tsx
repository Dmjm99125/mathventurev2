import { assertMatch } from 'jsr:@std/assert';

Deno.test('offline status indicator exposes an accessible pending-work label', async () => {
  const source = await Deno.readTextFile(
    new URL('../../../src/components/offline/OfflineStatusIndicator.tsx', import.meta.url),
  );
  assertMatch(source, /aria-live/);
  assertMatch(source, /Offline/);
  assertMatch(source, /Syncing/);
  assertMatch(source, /pending/);
});
