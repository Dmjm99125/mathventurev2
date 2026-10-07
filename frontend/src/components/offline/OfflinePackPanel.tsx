import { useState } from 'react';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';

export function OfflinePackPanel({ onRefresh }: { onRefresh?: () => Promise<void> }) {
  const { status, pendingCount, failedCount, lastSyncedAt, syncNow } = useOfflineClassroom();
  const [refreshing, setRefreshing] = useState(false);
  const isOnline = typeof navigator === 'undefined' || navigator.onLine;
  const refresh = async () => {
    if (!onRefresh || !isOnline) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <section aria-label="Offline classroom pack" className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">Offline classroom pack</h2>
          <p className="text-sm text-muted-foreground">
            {lastSyncedAt ? `Last saved ${lastSyncedAt}` : 'Download your classroom before going offline.'}
          </p>
          {!isOnline && <p className="text-sm font-bold text-muted-foreground">Refreshing the pack requires an internet connection.</p>}
          <p className="text-sm text-muted-foreground">{pendingCount} pending, {failedCount} failed.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void refresh()} disabled={!isOnline || refreshing} className="rounded-lg border px-3 py-2 text-sm font-bold">
            {refreshing ? 'Refreshing...' : 'Refresh classroom pack'}
          </button>
          <button type="button" onClick={() => void syncNow()} disabled={status === 'offline' || pendingCount === 0} className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
            Sync now
          </button>
        </div>
      </div>
    </section>
  );
}
