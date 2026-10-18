import { assertEquals } from 'jsr:@std/assert';
import { offlineStorageLabel } from '../../../../src/components/offline/OfflinePackPanel.tsx';

Deno.test('offline pack panel explains best-effort browser retention', () => {
  assertEquals(offlineStorageLabel('best-effort'), 'ready; browser-managed retention');
});
