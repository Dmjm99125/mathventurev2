import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './App';
import { isTauriRuntime } from './lib/offline/sqlite/platform';

import './index.css';

async function clearDevelopmentServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  const registrations = await navigator.serviceWorker.getRegistrations();
  const results = await Promise.all(registrations.map((registration) => registration.unregister()));
  if (hadController && results.some(Boolean)) window.location.reload();
}

if (!isTauriRuntime() && import.meta.env.DEV) {
  void clearDevelopmentServiceWorkers();
} else if (!isTauriRuntime()) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(<App />);
