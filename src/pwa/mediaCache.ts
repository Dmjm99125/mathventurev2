import type {
  FreePlayMediaManifest,
  FreePlayMediaManifestEntry,
} from '@/lib/offline/mediaManifest';

export type MediaDownloadState = 'not-downloaded' | 'downloading' | 'ready' | 'update-available' | 'error';

export interface MediaDownloadStatus {
  state: MediaDownloadState;
  version?: string;
  totalFiles: number;
  completedFiles: number;
  totalBytes: number;
  completedBytes: number;
  errorMessage?: string;
}

export function createStagingMediaCacheName(version: string): string {
  return `mathventure-free-play-media-staging-${version}`;
}

export function createActiveMediaCacheName(version: string): string {
  return `mathventure-free-play-media-${version}`;
}

export function getMissingMediaEntries(
  manifest: FreePlayMediaManifest,
  completedUrls: ReadonlySet<string>,
): FreePlayMediaManifestEntry[] {
  return manifest.entries.filter((entry) => !completedUrls.has(entry.url));
}

export function canActivateMediaCache(
  manifest: FreePlayMediaManifest,
  completedUrls: ReadonlySet<string>,
): boolean {
  return manifest.entries.every((entry) => completedUrls.has(entry.url));
}

export function buildMediaDownloadStatus(
  manifest: FreePlayMediaManifest,
  completedUrls: ReadonlySet<string>,
): MediaDownloadStatus {
  const completedEntries = manifest.entries.filter((entry) => completedUrls.has(entry.url));

  return {
    state: completedEntries.length === manifest.entries.length ? 'ready' : 'downloading',
    version: manifest.version,
    totalFiles: manifest.totalFiles,
    completedFiles: completedEntries.length,
    totalBytes: manifest.totalBytes,
    completedBytes: completedEntries.reduce((total, entry) => total + entry.bytes, 0),
  };
}

function parseRangeHeader(rangeHeader: string, totalBytes: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    return null;
  }

  const [, startText, endText] = match;
  if (!startText && !endText) {
    return null;
  }

  let start = startText ? Number(startText) : Math.max(totalBytes - Number(endText), 0);
  let end = endText ? Number(endText) : totalBytes - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= totalBytes) {
    return null;
  }

  end = Math.min(end, totalBytes - 1);
  return [start, end];
}

export async function createRangeResponse(request: Request, response: Response): Promise<Response | null> {
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return response;
  }

  const body = new Uint8Array(await response.arrayBuffer());
  const range = parseRangeHeader(rangeHeader, body.byteLength);
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${body.byteLength}` },
    });
  }

  const [start, end] = range;
  const headers = new Headers(response.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', `bytes ${start}-${end}/${body.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));

  return new Response(body.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers,
  });
}
