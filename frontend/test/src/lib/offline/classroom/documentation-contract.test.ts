import { assertStringIncludes } from 'jsr:@std/assert';

Deno.test('offline classroom documentation explains provisioning, sync, and online-only account actions', async () => {
  const document = await Deno.readTextFile(new URL('../../../../../../docs/offline-classroom.md', import.meta.url));
  assertStringIncludes(document, 'first online login');
  assertStringIncludes(document, 'Sync now');
  assertStringIncludes(document, 'password reset');
});
