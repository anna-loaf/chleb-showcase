// Włączenie web-push na tym telefonie. Wynik (subskrypcję) wklejasz jako sekret
// PUSH_SUBSCRIPTION w GitHubie — stamtąd skan maila wysyła powiadomienia.
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

function base64UrlToBytes(value) {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export async function subscribePush() {
  if (import.meta.env.DEV) throw new Error('Powiadomienia działają tylko w wersji wdrożonej (Vercel), nie w npm run dev.');
  if (!VAPID_PUBLIC_KEY) throw new Error('Brak VITE_VAPID_PUBLIC_KEY w ustawieniach Vercela.');
  // requestPermission musi paść bezpośrednio z tapnięcia — stąd wołamy to z przycisku.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Powiadomienia są zablokowane. Włącz je w Ustawieniach iPhone’a → Powiadomienia → Chleb.');
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY) }));
  return JSON.stringify(subscription);
}
