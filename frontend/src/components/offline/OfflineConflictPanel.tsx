import { useEffect, useState } from 'react';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';

export function OfflineConflictPanel() {
  const { repository } = useOfflineClassroom();
  const [conflicts, setConflicts] = useState<Record<string, unknown>[]>([]);
  const refresh = async () => setConflicts(await repository.listConflicts());
  useEffect(() => { void refresh(); }, [repository]);
  const resolve = async (key: string, choice: 'local' | 'server') => {
    await repository.resolveConflict(key, choice);
    await refresh();
  };
  const exportDiagnostics = async () => {
    const diagnostics = await repository.exportDiagnostics();
    const safe = { ...diagnostics, redactedFields: ['password', 'verifier'] };
    const blob = new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mathventure-offline-diagnostics.json';
    link.click();
    URL.revokeObjectURL(url);
  };
  if (conflicts.length === 0) return null;
  return (
    <section aria-label="Offline sync conflicts" className="rounded-xl border border-destructive/30 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-bold">Offline sync conflicts</h2>
        <button type="button" onClick={() => void exportDiagnostics()} className="text-sm font-bold underline">Export diagnostics</button>
      </div>
      <div className="space-y-3">
        {conflicts.map((conflict) => {
          const key = String(conflict.id ?? conflict.key ?? 'conflict');
          return (
            <div key={key} className="rounded-lg border border-border p-3">
              <p className="text-sm">{String(conflict.message ?? 'This item changed while offline.')}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void resolve(key, 'local')} className="rounded border px-2 py-1 text-sm font-bold">Keep local</button>
                <button type="button" onClick={() => void resolve(key, 'server')} className="rounded border px-2 py-1 text-sm font-bold">Keep server</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
