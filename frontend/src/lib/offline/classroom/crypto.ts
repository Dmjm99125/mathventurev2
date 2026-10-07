const DEVICE_ID_KEY = 'mathventure-offline-device-id';
const PBKDF2_ITERATIONS = 120_000;

export type OfflineCredentialRecord = {
  algorithm: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  verifier: string;
};

type StringStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
} | Map<string, string>;

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function deriveVerifier(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations, hash: 'SHA-256' },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function createPasswordVerifier(password: string): Promise<OfflineCredentialRecord> {
  if (!password) throw new Error('Offline password cannot be empty.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const verifier = await deriveVerifier(password, salt, PBKDF2_ITERATIONS);
  return {
    algorithm: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    verifier: toBase64(verifier),
  };
}

export async function verifyPasswordVerifier(
  password: string,
  record: OfflineCredentialRecord,
): Promise<boolean> {
  if (record.algorithm !== 'PBKDF2-SHA-256' || record.iterations < 1) return false;
  const derived = await deriveVerifier(password, fromBase64(record.salt), record.iterations);
  return equalBytes(derived, fromBase64(record.verifier));
}

export function getOrCreateDeviceId(storage: StringStorage): string {
  const existing = storage instanceof Map
    ? storage.get(DEVICE_ID_KEY)
    : storage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const deviceId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : toBase64(crypto.getRandomValues(new Uint8Array(18)));
  if (storage instanceof Map) {
    storage.set(DEVICE_ID_KEY, deviceId);
  } else {
    storage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
