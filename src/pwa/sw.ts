/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import {
  buildMediaDownloadStatus,
  canActivateMediaCache,
  createRangeResponse,
  createStagingMediaCacheName,
  getMissingMediaEntries,
  type MediaDownloadStatus,
} from './mediaCache';
import {
  isFreePlayMediaManifest,
  isFreePlayMediaUrl,
  type FreePlayMediaManifest,
} from '@/lib/offline/mediaManifest';
import {
  MEDIA_MANIFEST_URL,
  MEDIA_METADATA_DB,
  MEDIA_METADATA_STORE,
  isFreePlayWorkerRequest,
  type FreePlayWorkerRequest,
  type FreePlayWorkerResponse,
} from './cacheProtocol';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

precacheAndRoute(self.__WB_MANIFEST);

const ACTIVE_MEDIA_KEY = 'active-media';
const STATUS_KEY = 'media-status';
const MEDIA_CACHE_PREFIX = 'mathventure-free-play-media';

interface ActiveMediaRecord {
  version: string;
  cacheName: string;
}

interface MetadataRecord {
  key: string;
  value: ActiveMediaRecord | MediaDownloadStatus;
}

const emptyStatus: MediaDownloadStatus = {
  state: 'not-downloaded',
  totalFiles: 0,
  completedFiles: 0,
  totalBytes: 0,
  completedBytes: 0,
};

let downloadAbortController: AbortController | null = null;
let downloadPromise: Promise<void> | null = null;

function readMetadata<T extends ActiveMediaRecord | MediaDownloadStatus>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(MEDIA_METADATA_DB, 1);
    openRequest.onupgradeneeded = () => {
      openRequest.result.createObjectStore(MEDIA_METADATA_STORE, { keyPath: 'key' });
    };
    openRequest.onerror = () => reject(openRequest.error ?? new Error('Unable to open offline media storage.'));
    openRequest.onsuccess = () => {
      const database = openRequest.result;
      const transaction = database.transaction(MEDIA_METADATA_STORE, 'readonly');
      const request = transaction.objectStore(MEDIA_METADATA_STORE).get(key);
      request.onerror = () => reject(request.error ?? new Error('Unable to read offline media storage.'));
      request.onsuccess = () => resolve((request.result as MetadataRecord | undefined)?.value as T | undefined);
      transaction.oncomplete = () => database.close();
    };
  });
}

function writeMetadata(value: MetadataRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(MEDIA_METADATA_DB, 1);
    openRequest.onupgradeneeded = () => {
      openRequest.result.createObjectStore(MEDIA_METADATA_STORE, { keyPath: 'key' });
    };
    openRequest.onerror = () => reject(openRequest.error ?? new Error('Unable to open offline media storage.'));
    openRequest.onsuccess = () => {
      const database = openRequest.result;
      const transaction = database.transaction(MEDIA_METADATA_STORE, 'readwrite');
      transaction.objectStore(MEDIA_METADATA_STORE).put(value);
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save offline media storage.'));
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
    };
  });
}

async function readStatus(): Promise<MediaDownloadStatus> {
  return (await readMetadata<MediaDownloadStatus>(STATUS_KEY)) ?? emptyStatus;
}

async function saveStatus(status: MediaDownloadStatus): Promise<void> {
  await writeMetadata({ key: STATUS_KEY, value: status });
}

async function postToClients(message: FreePlayWorkerResponse, clientId?: string): Promise<void> {
  if (clientId) {
    const client = await self.clients.get(clientId);
    if (client) {
      client.postMessage(message);
      return;
    }
  }

  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage(message);
  }
}

async function broadcastStatus(status: MediaDownloadStatus, requestId?: string, clientId?: string): Promise<void> {
  await postToClients(
    requestId
      ? { type: 'MEDIA_STATUS', requestId, status }
      : { type: 'MEDIA_PROGRESS', status },
    clientId,
  );
}

async function fetchMediaManifest(): Promise<FreePlayMediaManifest> {
  const response = await fetch(MEDIA_MANIFEST_URL, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error('The Free Play media list could not be downloaded.');
  }

  const manifest: unknown = await response.json();
  if (!isFreePlayMediaManifest(manifest)) {
    throw new Error('The Free Play media list is invalid.');
  }
  return manifest;
}

async function cleanupMediaCaches(keepCacheName: string): Promise<void> {
  for (const cacheName of await caches.keys()) {
    if (cacheName.startsWith(MEDIA_CACHE_PREFIX) && cacheName !== keepCacheName) {
      await caches.delete(cacheName);
    }
  }
}

function readableError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Download paused. Retry to continue.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'The Free Play library could not be downloaded. Check your connection and try again.';
}

async function runMediaDownload(clientId: string | undefined, requestId: string): Promise<void> {
  const statusBeforeDownload = await readStatus();
  let progressStatus = statusBeforeDownload;

  try {
    const manifest = await fetchMediaManifest();
    const stagingCacheName = createStagingMediaCacheName(manifest.version);
    const stagingCache = await caches.open(stagingCacheName);
    const completedUrls = new Set<string>();

    for (const entry of manifest.entries) {
      const cached = await stagingCache.match(entry.url);
      if (cached?.ok) {
        completedUrls.add(entry.url);
      }
    }

    downloadAbortController = new AbortController();
    let status: MediaDownloadStatus = {
      ...buildMediaDownloadStatus(manifest, completedUrls),
      state: 'downloading',
    };
    progressStatus = status;
    await saveStatus(status);
    await broadcastStatus(status, undefined, clientId);

    for (const entry of getMissingMediaEntries(manifest, completedUrls)) {
      const response = await fetch(new URL(entry.url, self.location.origin), {
        cache: 'no-cache',
        signal: downloadAbortController.signal,
      });
      if (!response.ok) {
        throw new Error(`The file ${entry.url.split('/').pop() ?? 'media file'} could not be downloaded.`);
      }

      await stagingCache.put(entry.url, response.clone());
      completedUrls.add(entry.url);
      status = {
        ...buildMediaDownloadStatus(manifest, completedUrls),
        state: 'downloading',
      };
      progressStatus = status;
      await saveStatus(status);
      await broadcastStatus(status, undefined, clientId);
    }

    if (!canActivateMediaCache(manifest, completedUrls)) {
      throw new Error('The Free Play library is incomplete. Retry the download.');
    }

    const activeMedia: ActiveMediaRecord = {
      version: manifest.version,
      cacheName: stagingCacheName,
    };
    await writeMetadata({ key: ACTIVE_MEDIA_KEY, value: activeMedia });
    status = { ...buildMediaDownloadStatus(manifest, completedUrls), state: 'ready' };
    progressStatus = status;
    await saveStatus(status);
    await cleanupMediaCaches(stagingCacheName);
    await broadcastStatus(status, requestId, clientId);
  } catch (error) {
    const status: MediaDownloadStatus = {
      ...progressStatus,
      state: 'error',
      errorMessage: readableError(error),
    };
    await saveStatus(status);
    await postToClients({ type: 'MEDIA_ERROR', requestId, status }, clientId);
  } finally {
    downloadAbortController = null;
  }
}

async function startMediaDownload(clientId: string | undefined, requestId: string): Promise<void> {
  if (!downloadPromise) {
    downloadPromise = runMediaDownload(clientId, requestId).finally(() => {
      downloadPromise = null;
    });
  }
  await downloadPromise;
}

async function checkForMediaUpdate(): Promise<MediaDownloadStatus> {
  const manifest = await fetchMediaManifest();
  const activeMedia = await readMetadata<ActiveMediaRecord>(ACTIVE_MEDIA_KEY);
  const savedStatus = await readStatus();

  if (!activeMedia) {
    return {
      ...emptyStatus,
      version: manifest.version,
      totalFiles: manifest.totalFiles,
      totalBytes: manifest.totalBytes,
    };
  }

  if (activeMedia.version !== manifest.version) {
    return {
      ...emptyStatus,
      state: 'update-available',
      version: manifest.version,
      totalFiles: manifest.totalFiles,
      totalBytes: manifest.totalBytes,
    };
  }

  return savedStatus.state === 'ready'
    ? savedStatus
    : {
        ...buildMediaDownloadStatus(manifest, new Set(manifest.entries.map((entry) => entry.url))),
        state: 'ready',
      };
}

async function handleWorkerMessage(message: FreePlayWorkerRequest, clientId?: string): Promise<void> {
  if (message.type === 'GET_MEDIA_STATUS') {
    let status = await readStatus();
    if (!status.totalFiles) {
      try {
        status = await checkForMediaUpdate();
        await saveStatus(status);
      } catch {
        // The shell can still open when the manifest is temporarily unavailable.
      }
    }
    await broadcastStatus(status, message.requestId, clientId);
    return;
  }

  if (message.type === 'CHECK_MEDIA_UPDATE') {
    try {
      const status = await checkForMediaUpdate();
      await saveStatus(status);
      await broadcastStatus(status, message.requestId, clientId);
    } catch (error) {
      const status = { ...(await readStatus()), state: 'error' as const, errorMessage: readableError(error) };
      await saveStatus(status);
      await postToClients({ type: 'MEDIA_ERROR', requestId: message.requestId, status }, clientId);
    }
    return;
  }

  if (message.type === 'CANCEL_FREE_PLAY_MEDIA') {
    downloadAbortController?.abort();
    return;
  }

  await startMediaDownload(clientId, message.requestId);
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (!isFreePlayWorkerRequest(event.data)) {
    return;
  }

  const source = event.source;
  const clientId = source && 'id' in source ? source.id : undefined;
  event.waitUntil(handleWorkerMessage(event.data, clientId));
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  if (isFreePlayMediaUrl(request.url)) {
    event.respondWith(
      (async () => {
        const activeMedia = await readMetadata<ActiveMediaRecord>(ACTIVE_MEDIA_KEY);
        if (activeMedia) {
          const mediaCache = await caches.open(activeMedia.cacheName);
          const cached = await mediaCache.match(request.url);
          if (cached) {
            return (await createRangeResponse(request, cached)) ?? cached;
          }
        }
        return fetch(request);
      })(),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedShell = await caches.match('/index.html');
        return cachedShell ?? new Response('MathVenture is offline.', { status: 503 });
      }),
    );
  }
});
