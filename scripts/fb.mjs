// Etap 2: posty z publicznych grup FB przez Apify (tylko odczyt, płatność za post).
import { FB_ACTOR, FB_GROUPS, gapBefore, postsPerScan } from '../shared/fb-groups.js';

const PARALLEL = 4; // tyle grup naraz — szybciej, a blokada jednej nie psuje reszty

async function runGroup(token, group, gap) {
  const maxItems = postsPerScan(group, gap);
  const params = new URLSearchParams({ timeout: '240', maxTotalChargeUsd: (maxItems * 0.002 + 0.01).toFixed(3) });
  const res = await fetch(`https://api.apify.com/v2/acts/${FB_ACTOR}/run-sync-get-dataset-items?${params}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ url: group.url, sort: 'CHRONOLOGICAL', maxItems }),
  });
  if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

const toIso = (v) => {
  if (v == null || v === '') return '';
  const d = new Date(typeof v === 'number' ? (v < 1e12 ? v * 1000 : v) : v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

// Odporne na różne nazwy pól między scraperami.
export const mapPost = (i, group = '') => ({
  text: String(i.text ?? i.message ?? i.postText ?? ''),
  url: i.url ?? i.postUrl ?? i.permalink ?? '',
  time: toIso(i.publishTime ?? i.time ?? i.createdAt ?? i.date ?? i.timestamp),
  group: group || i.groupTitle || i.groupName || '',
});

export const isRecent = (post, now = Date.now(), hours = 13) => !post.time || now - Date.parse(post.time) <= hours * 3_600_000;

export async function fetchFbPosts(token, { log = console.log } = {}) {
  const gap = gapBefore(new Date().getUTCHours());
  const posts = [];
  const queue = [...FB_GROUPS];
  const stats = [];
  async function worker() {
    for (let group = queue.shift(); group; group = queue.shift()) {
      try {
        const items = (await runGroup(token, group, gap)).map((i) => mapPost(i, group.name)).filter((p) => p.text.trim());
        const fresh = items.filter((p) => isRecent(p, Date.now(), gap + 1));
        posts.push(...fresh);
        // Dobity limit i wszystkie posty świeże → mogło coś uciec; warto podnieść perMonth tej grupy.
        stats.push(`${group.name}: ${fresh.length}/${items.length}${items.length >= postsPerScan(group, gap) && fresh.length === items.length ? ' ⚠ limit' : ''}`);
      } catch (err) {
        stats.push(`${group.name}: BŁĄD ${err.message.slice(0, 80)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  log(`FB (świeże/pobrane): ${stats.join(' | ')}`);
  return posts;
}
