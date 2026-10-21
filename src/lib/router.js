// Nawigacja na hashach (#/czat) — działa offline i bez konfiguracji serwera.
import { useEffect, useState } from 'react';

// Każda chlebowa nazwa ma jasne znaczenie obok — nic nie jest zagadką.
export const ROUTES = {
  piec: { name: 'Piec', meaning: 'pulpit — Twój dzień w pigułce', tab: 'pulpit' },
  wydarzenia: { name: 'Co się piecze', meaning: 'wydarzenia: Kraków, Śląsk i cała Polska', tab: 'co się piecze' },
  role: { name: 'Świeże z pieca', meaning: 'role i castingi czekające na decyzję', tab: 'świeże z pieca' },
  znaki: { name: 'Znaki zapytania', meaning: 'ogłoszenia, których Chleb nie jest pewien', tab: 'role' },
  czat: { name: 'Zagadaj do Chleba', meaning: 'czat z Twoim agentem', tab: 'czat' },
  spizarnia: { name: 'Spiżarnia', meaning: 'historia castingów i statystyki', tab: 'historia' },
  receptura: { name: 'Receptura', meaning: 'baza wiedzy o Tobie — Chleb z niej korzysta', tab: 'o mnie' },
  zaplecze: { name: 'Zaplecze', meaning: 'ustawienia, budżet i kopia danych', tab: 'ustawienia' },
};

const current = () => {
  const r = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return ROUTES[r] ? r : 'piec';
};

let pending = null; // parametry dla widoku docelowego, np. szkic wiadomości do czatu

export function go(route, params) {
  pending = params ?? null;
  window.location.hash = route === 'piec' ? '/' : `/${route}`;
}

export function takeParams() {
  const p = pending;
  pending = null;
  return p;
}

export function useRoute() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const onHash = () => {
      setRoute(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
