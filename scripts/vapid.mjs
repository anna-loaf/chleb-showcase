// Jednorazowo: klucze VAPID do web-push. Publiczny → Vercel (VITE_VAPID_PUBLIC_KEY) i GitHub,
// prywatny → TYLKO GitHub Secrets (VAPID_PRIVATE_KEY). Uruchom: npm run vapid
import webpush from 'web-push';

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}`);
