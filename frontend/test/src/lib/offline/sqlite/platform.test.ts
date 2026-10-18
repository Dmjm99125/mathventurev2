import { assertEquals } from 'jsr:@std/assert';
import { isTauriRuntime } from '../../../../../src/lib/offline/sqlite/platform.ts';

Deno.test('ordinary test runtime is not detected as Tauri', () => {
  assertEquals(isTauriRuntime(), false);
});
