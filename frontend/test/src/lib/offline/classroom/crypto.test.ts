import { assert, assertEquals } from 'jsr:@std/assert';
import {
  createPasswordVerifier,
  getOrCreateDeviceId,
  verifyPasswordVerifier,
} from '../../../../../src/lib/offline/classroom/crypto.ts';

Deno.test('offline password verifier accepts the original password and rejects another', async () => {
  const verifier = await createPasswordVerifier('correct horse');

  assert(await verifyPasswordVerifier('correct horse', verifier));
  assertEquals(await verifyPasswordVerifier('wrong horse', verifier), false);
  assertEquals(JSON.stringify(verifier).includes('correct horse'), false);
});

Deno.test('device ID is stable for a storage key', () => {
  const storage = new Map<string, string>();
  const first = getOrCreateDeviceId(storage);
  const second = getOrCreateDeviceId(storage);
  assertEquals(first, second);
  assert(first.length > 10);
});
