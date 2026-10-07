import { assertMatch } from 'jsr:@std/assert';

Deno.test('offline conflict panel exposes both recovery choices and safe diagnostics', async () => {
  const source = await Deno.readTextFile(
    new URL('../../../src/components/offline/OfflineConflictPanel.tsx', import.meta.url),
  );
  assertMatch(source, /Keep local/);
  assertMatch(source, /Keep server/);
  assertMatch(source, /diagnostics/);
  assertMatch(source, /password|verifier/);
});
