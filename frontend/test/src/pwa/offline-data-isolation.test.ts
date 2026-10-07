import { assertStringIncludes } from 'jsr:@std/assert';

Deno.test('media cleanup is isolated from classroom IndexedDB storage', async () => {
  const protocol = await Deno.readTextFile(new URL('../../../src/pwa/cacheProtocol.ts', import.meta.url));
  const worker = await Deno.readTextFile(new URL('../../../src/pwa/sw.ts', import.meta.url));
  const classroomStore = await Deno.readTextFile(new URL('../../../src/lib/offline/classroom/store.ts', import.meta.url));
  assertStringIncludes(protocol, "mathventure-offline-media");
  assertStringIncludes(worker, 'MEDIA_CACHE_PREFIX');
  assertStringIncludes(worker, 'cacheName.startsWith(MEDIA_CACHE_PREFIX)');
  assertStringIncludes(classroomStore, "mathventure-classroom");
});
