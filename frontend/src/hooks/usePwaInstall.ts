import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPwaInstallClient,
  type InstallOutcome,
  type PwaInstallClient,
  type PwaInstallState,
} from '@/lib/pwa/install';

const initialState: PwaInstallState = {
  isReady: false,
  canInstall: false,
  isInstalled: false,
};

export interface PwaInstallView extends PwaInstallState {
  install: () => Promise<InstallOutcome>;
}

export function usePwaInstall(): PwaInstallView {
  const clientRef = useRef<PwaInstallClient | null>(null);
  const [state, setState] = useState<PwaInstallState>(initialState);

  useEffect(() => {
    const client = createPwaInstallClient();
    clientRef.current = client;
    setState(client.getState());

    const unsubscribe = client.subscribe(setState);
    return () => {
      unsubscribe();
      client.dispose();
      clientRef.current = null;
    };
  }, []);

  const install = useCallback(async () => {
    return clientRef.current?.install() ?? 'unavailable';
  }, []);

  return { ...state, install };
}
