import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createFreePlayOfflineClient,
  type FreePlayOfflineClient,
} from '@/lib/offline/freePlayOfflineClient';
import type { MediaDownloadStatus } from '@/pwa/mediaCache';

const emptyStatus: MediaDownloadStatus = {
  state: 'not-downloaded',
  totalFiles: 0,
  completedFiles: 0,
  totalBytes: 0,
  completedBytes: 0,
};

export interface FreePlayOfflineView {
  status: MediaDownloadStatus;
  isLoading: boolean;
  isSupported: boolean;
  errorMessage: string | null;
  download: () => Promise<MediaDownloadStatus | undefined>;
  cancel: () => Promise<void>;
  retry: () => Promise<MediaDownloadStatus | undefined>;
  checkForUpdate: () => Promise<MediaDownloadStatus | undefined>;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Offline Free Play is unavailable right now.';
}

export function useFreePlayOffline(): FreePlayOfflineView {
  const clientRef = useRef<FreePlayOfflineClient | null>(null);
  const [status, setStatus] = useState<MediaDownloadStatus>(emptyStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const client = createFreePlayOfflineClient();
    clientRef.current = client;

    const unsubscribe = client.subscribe((nextStatus) => {
      setStatus(nextStatus);
      setErrorMessage(nextStatus.errorMessage ?? null);
      setIsSupported(true);
    });

    const loadStatus = async () => {
      try {
        setStatus(await client.getStatus());
        setIsSupported(true);
      } catch (error) {
        setIsSupported(false);
        setErrorMessage(toErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    const refreshVersion = () => {
      if (!navigator.onLine) {
        return;
      }
      void client.checkForUpdate().then((nextStatus) => {
        setStatus(nextStatus);
        setErrorMessage(nextStatus.errorMessage ?? null);
      }).catch(() => {
        // A transient update check must not make an already-downloaded library look broken.
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshVersion();
      }
    };

    window.addEventListener('online', refreshVersion);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    void loadStatus();

    return () => {
      window.removeEventListener('online', refreshVersion);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribe();
      client.dispose();
      clientRef.current = null;
    };
  }, []);

  const download = useCallback(async () => {
    const client = clientRef.current;
    if (!client) {
      return undefined;
    }
    setErrorMessage(null);
    try {
      const nextStatus = await client.download();
      setStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    }
  }, []);

  const cancel = useCallback(async () => {
    const client = clientRef.current;
    if (!client) {
      return;
    }
    await client.cancel();
  }, []);

  const checkForUpdate = useCallback(async () => {
    const client = clientRef.current;
    if (!client) {
      return undefined;
    }
    try {
      const nextStatus = await client.checkForUpdate();
      setStatus(nextStatus);
      setErrorMessage(nextStatus.errorMessage ?? null);
      return nextStatus;
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    }
  }, []);

  return {
    status,
    isLoading,
    isSupported,
    errorMessage,
    download,
    cancel,
    retry: download,
    checkForUpdate,
  };
}
