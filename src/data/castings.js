// Spiżarnia (historia castingów) i Świeże z pieca (ogłoszenia czekające na decyzję).
import { db, changed, newId, nowIso } from '../db/db.js';
import { dayKey } from '../lib/dates.js';
import { clip } from '../../shared/text.js';

const byAppliedDesc = (a, b) => (b.appliedAt ?? '').localeCompare(a.appliedAt ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

export const listCastings = async () => (await (await db()).getAll('castings')).sort(byAppliedDesc);

export async function saveCasting(casting) {
  const d = await db();
  const prev = casting.id ? await d.get('castings', casting.id) : null;
  const now = nowIso();
  const status = casting.status ?? prev?.status ?? 'zaczyn';
  const history = prev?.statusHistory ?? [];
  const record = {
    source: '',
    contact: '',
    notes: '',
    link: '',
    deadline: null,
    ...prev,
    ...casting,
    id: casting.id ?? newId(),
    status,
    appliedAt: casting.appliedAt ?? prev?.appliedAt ?? dayKey(),
    statusHistory: prev?.status === status ? history : [...history, { status, at: now }],
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  await d.put('castings', record);
  changed('castings');
  return record;
}

export const setStatus = (id, status) => saveCasting({ id, status });

export async function deleteCasting(id) {
  await (await db()).delete('castings', id);
  changed('castings');
}

// ── Świeże z pieca ──────────────────────────────────────────────────────
const byDeadline = (a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') || (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

export const listInbox = async () => (await (await db()).getAll('inbox')).sort(byDeadline);

export async function addInboxItem({ assessment, text, source, title, deadline }) {
  const item = {
    id: newId(),
    createdAt: nowIso(),
    state: 'new',
    title: clip(title || assessment.fields.title, 90),
    source: source || assessment.fields.source || 'Wklejone',
    deadline: deadline || assessment.fields.deadline || null,
    castingDirector: assessment.fields.castingDirector,
    contact: assessment.fields.contact,
    link: assessment.fields.link,
    verdict: assessment.verdict,
    reasons: assessment.reasons,
    text,
  };
  await (await db()).put('inbox', item);
  changed('inbox');
  return item;
}

export async function dismissInbox(id) {
  const d = await db();
  const item = await d.get('inbox', id);
  if (!item) return;
  await d.put('inbox', { ...item, state: 'dismissed' });
  changed('inbox');
}

export async function restoreInbox(id) {
  const d = await db();
  const item = await d.get('inbox', id);
  if (!item) return;
  await d.put('inbox', { ...item, state: 'new', castingId: undefined });
  changed('inbox');
}

// „Zgłosiłam się” — jedno tapnięcie: pola z ogłoszenia lądują w Spiżarni jako Zaczyn.
export async function applyFromInbox(id) {
  const d = await db();
  const item = await d.get('inbox', id);
  if (!item) return null;
  const casting = await saveCasting({
    title: item.title,
    source: item.source,
    status: 'zaczyn',
    appliedAt: dayKey(),
    contact: [item.castingDirector, item.contact].filter(Boolean).join(' · '),
    link: item.link ?? '',
    deadline: item.deadline ?? null,
    notes: '',
    inboxId: item.id,
  });
  await d.put('inbox', { ...item, state: 'applied', castingId: casting.id });
  changed('inbox');
  return casting;
}

// Cofnięcie „Zgłosiłam się” (z toasta).
export async function undoApply(inboxId, castingId) {
  await deleteCasting(castingId);
  await restoreInbox(inboxId);
}
