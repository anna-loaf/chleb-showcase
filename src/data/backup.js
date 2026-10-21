// Kopia zapasowa (JSON). Hasło dostępu celowo NIE trafia do kopii.
import { db, changed, nowIso, STORES } from '../db/db.js';

const DATA_STORES = ['castings', 'inbox', 'tasks', 'chat', 'usage'];

export async function exportAll() {
  const d = await db();
  const data = {};
  for (const s of DATA_STORES) data[s] = await d.getAll(s);
  const keys = await d.getAllKeys('settings');
  const values = await d.getAll('settings');
  data.settings = Object.fromEntries(keys.map((k, i) => [k, values[i]]).filter(([k]) => k !== 'token'));
  return { app: 'chleb', version: 1, exportedAt: nowIso(), data };
}

export async function importAll(json) {
  if (json?.app !== 'chleb' || !json.data) throw new Error('To nie jest kopia zapasowa Chleba.');
  const d = await db();
  const tx = d.transaction(STORES, 'readwrite');
  for (const s of DATA_STORES) {
    const store = tx.objectStore(s);
    await store.clear();
    for (const record of json.data[s] ?? []) await store.put(record);
  }
  const settings = tx.objectStore('settings');
  const token = await settings.get('token');
  await settings.clear();
  for (const [key, value] of Object.entries(json.data.settings ?? {})) await settings.put(value, key);
  if (token) await settings.put(token, 'token');
  await tx.done;
  changed(...STORES);
}

export async function shareOrDownload(json) {
  const name = `chleb-kopia-${json.exportedAt.slice(0, 10)}.json`;
  const file = new File([JSON.stringify(json, null, 2)], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Kopia Chleba' });
    return;
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
