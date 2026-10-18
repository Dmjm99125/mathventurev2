import {
  isFreePlayMediaManifest,
  type FreePlayMediaManifest,
} from './mediaManifest';
import type { MediaDownloadStatus } from '@/pwa/mediaCache';
import type { FreePlayOfflineClient, OfflineStatusListener } from './freePlayOfflineClient';

export type TauriFreePlayOfflineClientOptions = {
  manifestUrl?: string;
  fetchManifest?: () => Promise<unknown>;
};

function defaultManifestUrl(): string {
  const documentLike = (globalThis as typeof globalThis & { document?: { baseURI: string } }).document;
  if (!documentLike) return '/free-play-media-manifest.json';
  return new URL('free-play-media-manifest.json', documentLike.baseURI).toString();
}

function readyStatus(manifest: FreePlayMediaManifest): MediaDownloadStatus {
  return {
    state: 'ready',
    version: manifest.version,
    totalFiles: manifest.totalFiles,
    completedFiles: manifest.totalFiles,
    totalBytes: manifest.totalBytes,
    completedBytes: manifest.totalBytes,
  };
}

export function createTauriFreePlayOfflineClient(options: TauriFreePlayOfflineClientOptions = {}): FreePlayOfflineClient {
  const listeners = new Set<OfflineStatusListener>();
  const fetchManifest = options.fetchManifest ?? (async () => {
    const response = await fetch(options.manifestUrl ?? defaultManifestUrl());
    if (!response.ok) throw new Error(`Bundled free-play media manifest could not be loaded (${response.status}).`);
    return response.json();
  });
  let manifestPromise: Promise<FreePlayMediaManifest> | null = null;
  let disposed = false;
  let status: MediaDownloadStatus = {
    state: 'not-downloaded',
    totalFiles: 0,
    completedFiles: 0,
    totalBytes: 0,
    completedBytes: 0,
  };

  const notify = () => {
    for (const listener of listeners) listener(status);
  };

  const prepare = async (): Promise<MediaDownloadStatus> => {
    if (disposed) throw new Error('Offline Free Play client was closed.');
    if (status.state === 'ready') return status;
    manifestPromise ??= fetchManifest().then((value) => {
      if (!isFreePlayMediaManifest(value)) throw new Error('Bundled free-play media manifest is invalid.');
      return value;
    });
    try {
      const manifest = await manifestPromise;
      status = readyStatus(manifest);
      notify();
      return status;
    } catch (error) {
      status = {
        ...status,
        state: 'error',
        errorMessage: error instanceof Error ? error.message : 'Bundled free-play media is unavailable.',
      };
      notify();
      throw error instanceof Error ? error : new Error(status.errorMessage);
    }
  };

  return {
    getStatus: prepare,
    checkForUpdate: prepare,
    download: prepare,
    cancel: async () => {},
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      disposed = true;
      listeners.clear();
    },
  };
}
