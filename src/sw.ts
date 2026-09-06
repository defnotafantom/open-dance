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

// Notifiche push: payload JSON { title, body, url }. Il click apre (o porta
// in primo piano) l'app sulla pagina indicata invece di limitarsi a
// chiudere la notifica.
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; url?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Open Dance", {
      body: payload.body ?? "",
      icon: "/icons/192",
      badge: "/icons/192",
      data: { url: payload.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url === url) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
