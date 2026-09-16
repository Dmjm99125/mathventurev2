import {
  AlertCircle,
  CheckCircle2,
  Download,
  HardDriveDownload,
  RefreshCw,
  WifiOff,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useFreePlayOffline } from '@/hooks/useFreePlayOffline';

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return 'Full library';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function progressPercent(completed: number, total: number): number {
  if (!total) {
    return 0;
  }
  return Math.min(100, Math.round((completed / total) * 100));
}

export function FreePlayOfflinePanel() {
  const { status, isLoading, isSupported, errorMessage, download, cancel, retry } = useFreePlayOffline();
  const percent = progressPercent(status.completedBytes, status.totalBytes);
  const isDownloading = status.state === 'downloading';

  const handleDownload = () => {
    void download().catch(() => undefined);
  };

  const handleRetry = () => {
    void retry().catch(() => undefined);
  };

  return (
    <section
      aria-labelledby="free-play-offline-title"
      className="w-full max-w-3xl overflow-hidden rounded-[28px] border-4 border-white/80 bg-white/95 text-left shadow-[0_18px_50px_rgba(34,94,49,0.12)]"
    >
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.72fr)] md:p-7">
        <div>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-jungle-yellow text-jungle-green">
              <HardDriveDownload className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">Offline library</p>
              <h2 id="free-play-offline-title" className="mt-1 text-2xl font-display font-extrabold text-foreground md:text-3xl">
                Keep Free Play ready without internet.
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-muted-foreground">
            Save every Free Play image, sound, and video on this device. Nothing downloads until a parent chooses to start it.
          </p>

          {!isSupported ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-700" role="status">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{errorMessage ?? 'Offline Free Play is not supported in this browser.'}</span>
            </div>
          ) : status.state === 'not-downloaded' ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="jungle" size="lg" onClick={handleDownload} disabled={isLoading}>
                <Download className="mr-2 h-5 w-5" aria-hidden="true" />
                Download Free Play for offline
              </Button>
              <span className="text-sm font-bold text-muted-foreground">One download for the full library</span>
            </div>
          ) : status.state === 'downloading' ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold text-foreground">Saving Free Play</p>
                  <p className="text-sm font-bold text-muted-foreground" aria-live="polite">
                    {status.totalFiles ? `${status.completedFiles.toLocaleString()} of ${status.totalFiles.toLocaleString()} files` : 'Preparing the library list…'}
                  </p>
                </div>
                <span className="text-3xl font-display font-extrabold tabular-nums text-primary">{percent}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Free Play offline download progress"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-4 overflow-hidden rounded-full bg-sky-100"
              >
                <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${percent}%` }} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-muted-foreground">
                <span>{formatBytes(status.completedBytes)} saved{status.totalBytes ? ` of ${formatBytes(status.totalBytes)}` : ''}</span>
                <Button variant="ghost" size="sm" onClick={() => void cancel()}>
                  <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Pause download
                </Button>
              </div>
            </div>
          ) : status.state === 'ready' ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800" role="status">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-extrabold">Offline ready</p>
                <p className="mt-1 text-sm font-semibold">Free Play can open with no internet on this device.</p>
              </div>
            </div>
          ) : status.state === 'update-available' ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="w-full text-lg font-extrabold text-foreground">Update available</p>
              <Button variant="jungle" size="lg" onClick={handleDownload}>
                <RefreshCw className="mr-2 h-5 w-5" aria-hidden="true" />
                Download update
              </Button>
              <span className="text-sm font-bold text-muted-foreground">Your current offline library stays usable while it updates.</span>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3" role="alert">
              <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-rose-800">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-sm font-bold">{errorMessage ?? status.errorMessage ?? 'The download stopped before it finished.'}</span>
              </div>
              <Button variant="outline" size="md" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Retry download
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-sky-50 p-5">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">What gets saved</p>
            <p className="mt-3 text-4xl font-display font-extrabold tabular-nums text-foreground">
              {formatBytes(status.totalBytes)}
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-muted-foreground">
              {status.totalFiles ? `${status.totalFiles.toLocaleString()} images, sounds, and videos` : 'The complete Free Play media library'}
            </p>
          </div>
          <p className="mt-6 text-sm font-semibold leading-6 text-muted-foreground">
            Free Play stays local. Quizzes and teacher progress still need an internet connection.
          </p>
        </div>
      </div>
    </section>
  );
}
