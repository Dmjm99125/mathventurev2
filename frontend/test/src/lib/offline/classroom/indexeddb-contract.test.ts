import { assertEquals } from 'jsr:@std/assert';
import {
  createIndexedDbStore,
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
} from '../../../../../src/lib/offline/classroom/store.ts';

Deno.test('IndexedDB adapter exposes the classroom database contract', () => {
  assertEquals(OFFLINE_DB_NAME, 'mathventure-classroom');
  assertEquals(OFFLINE_DB_VERSION, 1);
  assertEquals(typeof createIndexedDbStore().get, 'function');
});
