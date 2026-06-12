/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// ── Activation immédiate du nouveau service worker ───────────────────────────
// Sans skipWaiting/clientsClaim, un nouveau build reste « en attente » tant que
// tous les onglets ne sont pas fermés → les postes gardent l'ancien bundle en
// cache (assets 404, login cassé). On force l'activation et le contrôle direct.
self.skipWaiting();
clientsClaim();

// Purge les anciennes entrées de précache (évite les 404 bad-precaching-response)
cleanupOutdatedCaches();

// ── Workbox precaching (injecté par vite-plugin-pwa) ─────────────────────────
precacheAndRoute(self.__WB_MANIFEST);

// ── Runtime caching (équivalent de la config workbox dans vite.config.ts) ────

// Cache delivery endpoints — NetworkFirst (données fraîches en priorité, fallback cache)
registerRoute(
  ({ url }) => /^\/api\/v1\/delivery\/(tour|line|vehicle-load|pre-order|batch|objective|dashboard|credit-aging)(\/.*)?$/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'delivery-api',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 8 }), // 8h
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache les requêtes GET des entités principales — NetworkFirst
registerRoute(
  ({ url }) => /^\/api\/v1\/(accounts|contacts|leads|opportunities|reference-data|custom-fields)(\/.*)?$/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'api-entities',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache les autres endpoints API — StaleWhileRevalidate
registerRoute(
  ({ url }) => /^\/api\/v1\//.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'api-general',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 12 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache les assets statiques (images, fonts)
registerRoute(
  ({ url }) => /\.(png|jpg|jpeg|svg|gif|woff2?)$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// ── Navigation fallback ──────────────────────────────────────────────────────
import { NavigationRoute } from 'workbox-routing';
import { createHandlerBoundToURL } from 'workbox-precaching';

const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [/^\/api/],
});
registerRoute(navigationRoute);

// ── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'OptiCRM', {
      body: data.message ?? '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { link: data.link },
      tag: data.id ?? `opticrm-${Date.now()}`,
    })
  );
});

// Click sur la notification → naviguer vers le lien
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Chercher une fenêtre OptiCRM existante
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          if (link) {
            client.postMessage({ type: 'NAVIGATE', link });
          }
          return;
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (link) {
        self.clients.openWindow(link);
      }
    })
  );
});
