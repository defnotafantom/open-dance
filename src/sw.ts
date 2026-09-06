import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// I dati di pagamenti/iscrizioni non vanno mai serviti da cache stantia:
// un genitore non deve vedere uno stato "pagato" vecchio mentre e' offline.
const noStaleDataRuntimeCaching = [
  {
    matcher: ({ url }: { url: URL }) =>
      /\/(pagamenti|iscrizioni)(\/|$)/.test(url.pathname),
    handler: new NetworkFirst({
      cacheName: "no-stale-data",
      networkTimeoutSeconds: 8,
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...noStaleDataRuntimeCaching, ...defaultCache],
});

serwist.addEventListeners();
