import { db, changed, nowIso } from '../db/db.js';
import { monthKey } from '../lib/dates.js';
import { addUsage } from '../lib/costs.js';
import { setSetting } from './settings.js';

export const listChat = async () => (await db()).getAll('chat');

export async function addMessage(message) {
  const id = await (await db()).add('chat', { createdAt: nowIso(), ...message });
  changed('chat');
  return id;
}

export async function updateMessage(id, patch) {
  const d = await db();
  const current = await d.get('chat', id);
  if (!current) return;
  await d.put('chat', { ...current, ...patch });
  changed('chat');
}

export async function deleteMessage(id) {
  await (await db()).delete('chat', id);
  changed('chat');
}

export async function clearChat() {
  await (await db()).clear('chat');
  await setSetting('chatWindowStart', 0);
  changed('chat');
}

// ── Zużycie (licznik zł) ────────────────────────────────────────────────
export async function recordUsage(model, usage) {
  const month = monthKey();
  const d = await db();
  await d.put('usage', addUsage(month, await d.get('usage', month), model, usage));
  changed('usage');
}

export const getUsage = async (month = monthKey()) => (await (await db()).get('usage', month)) ?? null;
