import { assertStringIncludes } from 'jsr:@std/assert';

Deno.test('app shell mounts the offline classroom provider and status indicator', async () => {
  const app = await Deno.readTextFile(new URL('../../../src/App.tsx', import.meta.url));
  const layout = await Deno.readTextFile(new URL('../../../src/components/layout.tsx', import.meta.url));
  assertStringIncludes(app, 'OfflineClassroomProvider');
  assertStringIncludes(layout, 'OfflineStatusIndicator');
});
