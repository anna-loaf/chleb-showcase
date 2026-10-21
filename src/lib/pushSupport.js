// Czy da się włączyć powiadomienia? Na iPhonie web push działa tylko w apce
// dodanej do ekranu początkowego (w zwykłej karcie Safari nie ma PushManager).
export function detectPush() {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (supported) return { state: 'ready', standalone, ios, permission: Notification.permission };
  if (ios && !standalone) return { state: 'install', standalone, ios };
  return { state: 'unsupported', standalone, ios };
}
