// Service worker: apka działa offline (precache), aktualizacja na Twoje tapnięcie.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';
import { openDB } from 'idb';

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Każdy adres apki → index.html z cache; /api/ zawsze idzie do sieci.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//] }));

// ── Etap 2: push z trafieniami ze skanu maila ─────────────────────────────
// Zapis do „Świeżych z pieca” (ta sama baza co apka) + powiadomienie. Na iOS każdy push
// MUSI pokazać powiadomienie, inaczej Safari cofa subskrypcję.
async function saveHits(hits) {
  const d = await openDB('chleb', 1); // baza tworzona przez apkę przy pierwszym otwarciu
  const fresh = [];
  for (const hit of hits) {
    if (await d.get('inbox', hit.id)) continue;
    const item = { ...hit, state: 'new', createdAt: new Date().toISOString() };
    await d.put('inbox', item);
    fresh.push(item);
  }
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((c) => c.postMessage({ type: 'inbox-updated' }));
  return fresh;
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let data = {};
      try {
        data = event.data?.json() ?? {};
      } catch {}
      if (data.type === 'events') {
        await self.registration.showNotification(data.title ?? 'Co się piecze', { body: data.body ?? '', icon: '/icons/pwa-192.png', badge: '/icons/pwa-192.png', tag: 'events', data: { url: '/' } });
        return;
      }
      const hits = data.type === 'castings' && Array.isArray(data.hits) ? data.hits : [];
      const fresh = hits.length ? await saveHits(hits).catch(() => hits) : [];
      const all = fresh.length ? fresh : hits;
      const list = all.filter((h) => h.verdict !== 'unsure');
      const unsure = all.length - list.length;
      if (!list.length) {
        // Same znaki zapytania: ciche powiadomienie (iOS wymaga jakiegoś), bez dźwięku.
        await self.registration.showNotification('Znaki zapytania', { body: `${unsure || hits.length} do przejrzenia, bez pośpiechu.`, silent: true, icon: '/icons/pwa-192.png', badge: '/icons/pwa-192.png', tag: 'unsure', data: { url: '/#/znaki' } });
        return;
      }
      const title = list.length === 1 ? 'Świeże z pieca: nowy casting' : `Świeże z pieca: ${list.length} castingi`;
      const body = list.map((h) => `${h.verdict === 'match' ? '✓' : '?'} ${h.title}`).join('\n') + (unsure ? `\n+ ${unsure} w Znakach zapytania` : '');
      await self.registration.showNotification(title, { body, icon: '/icons/pwa-192.png', badge: '/icons/pwa-192.png', tag: 'castings', data: { url: '/' } });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = clients[0];
      if (open) {
        await open.focus();
        if (event.notification.data?.url) open.navigate?.(event.notification.data.url)?.catch?.(() => {});
        return;
      }
      return self.clients.openWindow(event.notification.data?.url ?? '/');
    })(),
  );
});
