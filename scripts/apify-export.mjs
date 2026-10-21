// Pobiera wyniki WSZYSTKICH uruchomień Apify z ostatnich N dni do jednego pliku (tylko odczyt).
// Uruchom: node scripts/apify-export.mjs [dni=35]
import { writeFileSync, mkdirSync } from 'node:fs';
process.loadEnvFile('.env');
const token = process.env.APIFY_TOKEN?.trim();
if (!token) throw new Error('Brak APIFY_TOKEN w .env');
const days = Number(process.argv[2] ?? 35);
const since = Date.now() - days * 86_400_000;
const api = async (path) => {
  const res = await fetch(`https://api.apify.com/v2${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
};
const runs = (await api('/actor-runs?desc=1&limit=1000')).data.items.filter((r) => new Date(r.startedAt).getTime() >= since);
const actors = {};
const items = [];
let usd = 0;
for (const run of runs) {
  usd += run.usageTotalUsd ?? 0;
  actors[run.actId] ??= (await api(`/acts/${run.actId}`)).data.name;
  const data = await api(`/datasets/${run.defaultDatasetId}/items?clean=true&format=json`);
  for (const it of data) items.push({ _run: run.id, _startedAt: run.startedAt, _actor: actors[run.actId], ...it });
}
mkdirSync('dane', { recursive: true });
writeFileSync('dane/apify-posts.json', JSON.stringify(items, null, 1));
console.log(`Uruchomienia: ${runs.length} | aktory: ${[...new Set(Object.values(actors))].join(', ')} | wyniki: ${items.length} | koszt Apify: $${usd.toFixed(2)}`);
