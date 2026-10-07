import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';

function statusLabel(status: string): string {
  if (status === 'offline') return 'Offline';
  if (status === 'syncing') return 'Syncing';
  if (status === 'needs-auth') return 'Needs sign-in';
  if (status === 'error') return 'Sync error';
  return 'Online';
}

export function OfflineStatusIndicator() {
  const { status, pendingCount, failedCount, syncNow } = useOfflineClassroom();
  return (
    <div aria-live="polite" className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
      <span>{statusLabel(status)}</span>
      {pendingCount > 0 && <span>{pendingCount} pending</span>}
      {failedCount > 0 && <span>{failedCount} failed</span>}
      {status !== 'offline' && pendingCount > 0 && (
        <button type="button" onClick={() => void syncNow()} className="underline underline-offset-2">
          Sync now
        </button>
      )}
    </div>
  );
}
