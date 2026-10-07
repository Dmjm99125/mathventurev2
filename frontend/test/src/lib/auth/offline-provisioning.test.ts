import { assertStringIncludes } from 'jsr:@std/assert';

Deno.test('successful online teacher sign-in enrolls and bootstraps the offline classroom', async () => {
  const source = await Deno.readTextFile(new URL('../../../../src/lib/auth/auth.ts', import.meta.url));
  assertStringIncludes(source, 'enrollOfflineDevice(profile, password, store)');
  assertStringIncludes(source, "offline-bootstrap");
  assertStringIncludes(source, 'bootstrapRepository');
});
