import type { OfflineCredentialRecord } from './crypto.ts';

export type OfflineEnrollmentRecord = {
  deviceId: string;
  verifier: OfflineCredentialRecord;
  profile: { id: string; role: 'teacher'; full_name: string };
  lastOnlineValidatedAt: string;
  offlineAccessUntil: string;
};

export const OFFLINE_LEASE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid offline lease timestamp: ${value}`);
  return parsed;
}

export function renewOfflineLease(
  now: string,
  enrollment: OfflineEnrollmentRecord,
): OfflineEnrollmentRecord {
  const nowMs = timestamp(now);
  return {
    ...enrollment,
    lastOnlineValidatedAt: new Date(nowMs).toISOString(),
    offlineAccessUntil: new Date(nowMs + OFFLINE_LEASE_DURATION_MS).toISOString(),
  };
}

export function isOfflineLeaseValid(now: string, enrollment: OfflineEnrollmentRecord): boolean {
  const nowMs = Date.parse(now);
  const validatedAt = Date.parse(enrollment.lastOnlineValidatedAt);
  const expiresAt = Date.parse(enrollment.offlineAccessUntil);
  return Number.isFinite(nowMs)
    && Number.isFinite(validatedAt)
    && Number.isFinite(expiresAt)
    && validatedAt <= nowMs
    && nowMs < expiresAt;
}
