import {
  MEDIA_MANIFEST_URL,
  type FreePlayWorkerResponse,
} from '@/pwa/cacheProtocol';
import type { MediaDownloadStatus } from '@/pwa/mediaCache';

export type OfflineStatusListener = (status: MediaDownloadStatus) => void;

export interface FreePlayOfflineClient {
  getStatus(): Promise<MediaDownloadStatus>;
  checkForUpdate(): Promise<MediaDownloadStatus>;
  download(): Promise<MediaDownloadStatus>;
  cancel(): Promise<void>;
  subscribe(listener: OfflineStatusListener): () => void;
  dispose(): void;
}

export interface FreePlayOfflineClientOptions {
  requestTimeoutMs?: number;
}

interface PendingRequest {
  resolve: (status: MediaDownloadStatus) => void;
  reject: (error: Error) => void;
  timeoutId?: ReturnType<typeof globalThis.setTimeout>;
}

interface OfflineServiceWorker {
  postMessage(message: unknown): void;
}

interface OfflineServiceWorkerRegistration {
  active?: OfflineServiceWorker | null;
  waiting?: OfflineServiceWorker | null;
  installing?: OfflineServiceWorker | null;
}

export interface OfflineServiceWorkerContainer extends EventTarget {
  controller?: OfflineServiceWorker | null;
  ready: Promise<OfflineServiceWorkerRegistration>;
}

const REQUEST_TIMEOUT_MS = 15_000;

function unsupportedError(): Error {
  return new Error('Offline Free Play is not supported in this browser.');
}

function requestId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function messageError(status: MediaDownloadStatus): Error {
  return new Error(status.errorMessage ?? 'Offline Free Play could not complete that action.');
}

function defaultServiceWorkerContainer(): OfflineServiceWorkerContainer | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }
  return (navigator as Navigator & { serviceWorker?: OfflineServiceWorkerContainer }).serviceWorker;
}

export function createFreePlayOfflineClient(
  container: OfflineServiceWorkerContainer | undefined = defaultServiceWorkerContainer(),
  options: FreePlayOfflineClientOptions = {},
): FreePlayOfflineClient {
  const requestTimeoutMs = options.requestTimeoutMs ?? REQUEST_TIMEOUT_MS;
  const listeners = new Set<OfflineStatusListener>();
  const pending = new Map<string, PendingRequest>();
  let disposed = false;

  const notify = (status: MediaDownloadStatus) => {
    for (const listener of listeners) {
      listener(status);
    }
  };

  const onMessage = (event: MessageEvent<FreePlayWorkerResponse>) => {
    const message = event.data;
    if (!message || !('type' in message)) {
      return;
    }

    if (message.type === 'MEDIA_PROGRESS') {
      notify(message.status);
      return;
    }

    notify(message.status);
    if (!message.requestId) {
      return;
    }

    const request = pending.get(message.requestId);
    if (!request) {
      return;
    }
    pending.delete(message.requestId);
    if (request.timeoutId) {
      globalThis.clearTimeout(request.timeoutId);
    }

    if (message.type === 'MEDIA_ERROR' || message.status.state === 'error') {
      request.reject(messageError(message.status));
    } else {
      request.resolve(message.status);
    }
  };

  container?.addEventListener('message', onMessage as EventListener);

  async function getWorker(): Promise<OfflineServiceWorker> {
    if (disposed || !container) {
      throw unsupportedError();
    }

    const registration = await container.ready;
    const worker = container.controller ?? registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) {
      throw new Error('Offline Free Play is still starting. Please try again in a moment.');
    }
    return worker;
  }

  function sendRequest(
    type: 'GET_MEDIA_STATUS' | 'DOWNLOAD_FREE_PLAY_MEDIA' | 'CHECK_MEDIA_UPDATE',
    timeoutMs: number | null = requestTimeoutMs,
  ): Promise<MediaDownloadStatus> {
    const id = requestId();
    return new Promise<MediaDownloadStatus>((resolve, reject) => {
      const timeoutId = timeoutMs === null
        ? undefined
        : globalThis.setTimeout(() => {
            pending.delete(id);
            reject(new Error('Offline Free Play took too long to respond. Please try again.'));
          }, timeoutMs);
      pending.set(id, { resolve, reject, timeoutId });

      void getWorker()
        .then((worker) => worker.postMessage({ type, requestId: id }))
        .catch((error: unknown) => {
          if (timeoutId) {
            globalThis.clearTimeout(timeoutId);
          }
          pending.delete(id);
          reject(error instanceof Error ? error : new Error('Offline Free Play is unavailable.'));
        });
    });
  }

  return {
    getStatus: () => sendRequest('GET_MEDIA_STATUS'),
    checkForUpdate: () => sendRequest('CHECK_MEDIA_UPDATE'),
    download: () => sendRequest('DOWNLOAD_FREE_PLAY_MEDIA', null),
    cancel: async () => {
      const worker = await getWorker();
      worker.postMessage({ type: 'CANCEL_FREE_PLAY_MEDIA', requestId: requestId() });
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      disposed = true;
      container?.removeEventListener('message', onMessage as EventListener);
      for (const request of pending.values()) {
        if (request.timeoutId) {
          globalThis.clearTimeout(request.timeoutId);
        }
        request.reject(new Error('Offline Free Play client was closed.'));
      }
      pending.clear();
      listeners.clear();
    },
  };
}

export { MEDIA_MANIFEST_URL };
