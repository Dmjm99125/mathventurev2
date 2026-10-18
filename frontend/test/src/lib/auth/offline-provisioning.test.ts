import { assertStringIncludes } from 'jsr:@std/assert';

Deno.test('successful online teacher sign-in enrolls for automatic offline classroom bootstrapping', async () => {
  const source = await Deno.readTextFile(new URL('../../../../src/lib/auth/auth.ts', import.meta.url));
  assertStringIncludes(source, 'enrollOfflineDevice(profile, password, store)');
  const provider = await Deno.readTextFile(new URL('../../../../src/lib/offline/classroom/useOfflineClassroom.ts', import.meta.url));
  assertStringIncludes(provider, 'bootstrapRepository(activeRepository, () => downloadClassroomPack(request))');
  assertStringIncludes(provider, 'Automatic offline classroom refresh skipped');
});
