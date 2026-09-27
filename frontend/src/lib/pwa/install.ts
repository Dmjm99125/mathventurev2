export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export interface PwaInstallTarget extends EventTarget {
  matchMedia?: (query: string) => { matches: boolean };
  navigator?: {
    standalone?: boolean;
  };
}

export interface PwaInstallState {
  isReady: boolean;
  canInstall: boolean;
  isInstalled: boolean;
}

export type PwaInstallListener = (state: PwaInstallState) => void;

export interface PwaInstallClient {
  getState: () => PwaInstallState;
  install: () => Promise<InstallOutcome>;
  subscribe: (listener: PwaInstallListener) => () => void;
  dispose: () => void;
}

function defaultTarget(): PwaInstallTarget | undefined {
  return typeof window === 'undefined' ? undefined : (window as unknown as PwaInstallTarget);
}

function isStandalone(target: PwaInstallTarget): boolean {
  return Boolean(
    target.matchMedia?.('(display-mode: standalone)').matches
      || target.navigator?.standalone,
  );
}

export function createPwaInstallClient(
  target: PwaInstallTarget | undefined = defaultTarget(),
): PwaInstallClient {
  const listeners = new Set<PwaInstallListener>();
  let installPrompt: InstallPromptEvent | null = null;
  let state: PwaInstallState = {
    isReady: Boolean(target),
    canInstall: false,
    isInstalled: target ? isStandalone(target) : false,
  };

  const publish = (nextState: PwaInstallState) => {
    state = nextState;
    for (const listener of listeners) {
      listener(state);
    }
  };

  const onBeforeInstallPrompt = (event: Event) => {
    const promptEvent = event as InstallPromptEvent;
    promptEvent.preventDefault();
    installPrompt = promptEvent;
    publish({ ...state, canInstall: !state.isInstalled });
  };

  const onAppInstalled = () => {
    installPrompt = null;
    publish({ ...state, canInstall: false, isInstalled: true });
  };

  target?.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  target?.addEventListener('appinstalled', onAppInstalled);

  return {
    getState: () => state,
    install: async () => {
      if (!installPrompt || state.isInstalled) {
        return 'unavailable';
      }

      const promptEvent = installPrompt;
      installPrompt = null;
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        publish({ ...state, canInstall: false });
        return choice.outcome;
      } catch {
        publish({ ...state, canInstall: false });
        return 'unavailable';
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      target?.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      target?.removeEventListener('appinstalled', onAppInstalled);
      listeners.clear();
      installPrompt = null;
    },
  };
}
