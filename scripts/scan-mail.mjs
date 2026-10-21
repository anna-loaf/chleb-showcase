// Etap 2: skan DEDYKOWANEJ skrzynki castingowej → filtr emploi → web-push tylko z trafieniami.
// Uruchamiany przez GitHub Actions 3× dziennie (.github/workflows/scan.yml).
// Lokalny test bez wysyłania pushy i bez oznaczania maili:  npm run scan -- --dry-run
import { createHash } from 'node:crypto';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import webpush from 'web-push';
import { assessCasting, localToday } from '../shared/filter.js';
import { SOURCES } from '../shared/emploi.js';
import { clip, normalize } from '../shared/text.js';
import { fetchFbPosts } from './fb.mjs';

const DRY = process.argv.includes('--dry-run');
try {
  process.loadEnvFile('.env'); // lokalnie; w GitHub Actions zmienne przychodzą z Secrets
} catch {}

const env = (name, required = true) => {
  const v = process.env[name]?.trim();
  if (!v && required) throw new Error(`Brak zmiennej ${name}`);
  return v;
};

const LABEL = 'chleb'; // etykieta Gmaila na przetworzonych mailach
const SENDERS = Object.keys(SOURCES);
const PUSH_LIMIT = 3000; // bajty payloadu (limit usług push ~4 KB)

async function fetchNewMails() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: env('CASTING_IMAP_USER'), pass: env('CASTING_IMAP_APP_PASSWORD').replace(/\s+/g, '') },
    logger: false,
  });
  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  const mails = [];
  try {
    const query = `from:(${SENDERS.join(' OR ')}) -label:${LABEL} newer_than:7d`;
    const uids = (await client.search({ gmraw: query }, { uid: true })) || [];
    for (const msg of uids.length ? await client.fetchAll(uids, { source: true }, { uid: true }) : []) {
      const parsed = await simpleParser(msg.source);
      mails.push({
        uid: msg.uid,
        id: createHash('sha1').update(parsed.messageId ?? `${msg.uid}`).digest('hex').slice(0, 16),
        from: parsed.from?.value?.[0]?.address ?? '',
        subject: parsed.subject ?? '',
        text: parsed.text || String(parsed.html ?? '').replace(/<[^>]+>/g, ' '),
      });
    }
    if (!DRY && uids.length) await client.messageFlagsAdd(uids, [LABEL], { uid: true, useLabels: true });
  } finally {
    lock.release();
    await client.logout();
  }
  return mails;
}

// Ten sam post w kilku grupach / mail + FB → ten sam odcisk → jedno powiadomienie.
const fingerprint = (text) => createHash('sha1').update(normalize(text).replace(/[^a-z0-9]/g, '').slice(0, 160)).digest('hex').slice(0, 16);

function toHit({ subject = '', text, from, source, link }, today) {
  const a = assessCasting({ subject, text, from }, today);
  if (!['match', 'maybe', 'unsure'].includes(a.verdict)) return null; // trafienia + znaki zapytania
  return {
    id: `c-${fingerprint(subject + text)}`,
    title: clip(a.fields.title, 90),
    source: source || a.fields.source || 'Mail',
    deadline: a.fields.deadline,
    castingDirector: a.fields.castingDirector,
    contact: a.fields.contact,
    link: link || a.fields.link,
    verdict: a.verdict,
    reasons: a.reasons.slice(0, 5),
    text: clip(text, 1200),
  };
}

// Paczki mieszczące się w limicie pushu; w razie potrzeby tniemy treść ogłoszeń.
function packs(hits) {
  const out = [];
  let cur = [];
  const size = (list) => Buffer.byteLength(JSON.stringify({ type: 'castings', hits: list }));
  for (let hit of hits) {
    if (size([hit]) > PUSH_LIMIT) hit = { ...hit, text: clip(hit.text, 300), reasons: hit.reasons.slice(0, 3) };
    if (size([hit]) > PUSH_LIMIT) hit = { ...hit, text: '' };
    if (cur.length && size([...cur, hit]) > PUSH_LIMIT) {
      out.push(cur);
      cur = [];
    }
    cur.push(hit);
  }
  if (cur.length) out.push(cur);
  return out;
}

async function main() {
  const today = localToday();
  const mails = process.env.CASTING_IMAP_USER ? await fetchNewMails() : [];
  const token = process.env.APIFY_TOKEN?.trim();
  const posts = token && !process.argv.includes('--no-fb') ? await fetchFbPosts(token) : [];
  const candidates = [
    ...mails.map((m) => ({ subject: m.subject, text: m.text, from: m.from })),
    ...posts.map((p) => ({ text: p.text, from: 'fb-scraper', source: `Facebook: ${p.group}`, link: p.url })),
  ];
  const byId = new Map();
  for (const c of candidates) {
    const hit = toHit(c, today);
    if (hit && !byId.has(hit.id)) byId.set(hit.id, hit);
  }
  const hits = [...byId.values()];
  console.log(`Maile: ${mails.length}, posty FB: ${posts.length}, trafienia (bez duplikatów): ${hits.length}`);
  for (const h of hits) console.log(` • [${h.verdict}] ${h.title}${h.deadline ? ` (deadline ${h.deadline})` : ''} — ${h.source}`);
  if (DRY || !hits.length) return;

  webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));
  const subscription = JSON.parse(env('PUSH_SUBSCRIPTION'));
  for (const pack of packs(hits)) {
    await webpush.sendNotification(subscription, JSON.stringify({ type: 'castings', hits: pack }), { TTL: 60 * 60 * 24 * 3 });
  }
  console.log('Push wysłany.');
}

main().catch((err) => {
  // 404/410 = subskrypcja wygasła (np. apka usunięta z ekranu) → trzeba ją odnowić w Zapleczu.
  if (err?.statusCode === 404 || err?.statusCode === 410) console.error('Subskrypcja push wygasła — w apce: Zaplecze → Dzwonek → włącz ponownie i podmień sekret PUSH_SUBSCRIPTION.');
  if (err?.authenticationFailed) console.error('Gmail odrzucił logowanie — sprawdź CASTING_IMAP_USER i hasło aplikacji (skopiuj je od nowa).');
  console.error(err?.responseText ?? err?.message ?? err);
  process.exit(1);
});
