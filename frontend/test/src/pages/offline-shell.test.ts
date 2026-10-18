import { assertStringIncludes } from 'jsr:@std/assert';

Deno.test('app shell mounts the offline classroom provider and status indicator', async () => {
  const app = await Deno.readTextFile(new URL('../../../src/App.tsx', import.meta.url));
  const layout = await Deno.readTextFile(new URL('../../../src/components/layout.tsx', import.meta.url));
  assertStringIncludes(app, 'OfflineClassroomProvider');
  assertStringIncludes(layout, 'OfflineStatusIndicator');
});

Deno.test('offline classroom provider declares callbacks before its loading return', async () => {
  const provider = await Deno.readTextFile(new URL('../../../src/lib/offline/classroom/useOfflineClassroom.ts', import.meta.url));
  const loadingReturn = provider.indexOf("if (!resolvedRepository) {");
  const syncCallback = provider.indexOf('const syncNow = useCallback');
  const bootstrapCallback = provider.indexOf('const bootstrapNow = useCallback');

  if (loadingReturn < 0 || syncCallback < 0 || bootstrapCallback < 0 || syncCallback > loadingReturn || bootstrapCallback > loadingReturn) {
    throw new Error('Offline callbacks must be declared before the provider loading return.');
  }
});
