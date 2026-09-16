/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

precacheAndRoute(self.__WB_MANIFEST);
