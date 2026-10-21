// „Składniki na dziś”: zadania z castingów (self-tape, bliski deadline) + rozwojowe z banku.
// Czysta logika — zapis do IndexedDB robi src/data/tasks.js.
import { AREAS, AGENCIES, TASK_BANK } from './content/taskBank.js';
import { daysBetween, fmtShort, relDays } from './dates.js';
import { TASKS_PER_DAY } from '../config.js';

const AREA_ORDER = Object.keys(AREAS);
const EPOCH = '2026-01-01';

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function devTask(area, variant, day) {
  const list = TASK_BANK[area];
  const item = list[((variant % list.length) + list.length) % list.length];
  const agency = AGENCIES[hash(day) % AGENCIES.length];
  return { area, variant, text: item.text.replace('{agency}', agency), min: item.min };
}

// Ten sam dzień = te same zadania; obszary rotują, a w obszarze kolejne zadania z banku.
export function planDevTasks(day, count = TASKS_PER_DAY) {
  const n = daysBetween(EPOCH, day);
  return Array.from({ length: count }, (_, k) => {
    const slot = n * count + k;
    const area = AREA_ORDER[((slot % AREA_ORDER.length) + AREA_ORDER.length) % AREA_ORDER.length];
    return { id: `${day}:dev:${k}`, date: day, kind: 'dev', done: false, ...devTask(area, Math.floor(slot / AREA_ORDER.length), day) };
  });
}

// „Inny składnik” — następne zadanie z tego samego obszaru.
export const swapped = (task) => ({ ...task, ...devTask(task.area, task.variant + 1, task.date), done: false });

export function castingTasks({ castings = [], inbox = [], day }) {
  const tasks = [];
  for (const c of castings.filter((x) => x.status === 'wyrasta')) {
    const when = c.deadline ? ` — deadline ${fmtShort(c.deadline)} (${relDays(c.deadline, day)})` : '';
    tasks.push({ id: `${day}:selftape:${c.id}`, date: day, kind: 'casting', area: 'casting', ref: c.id, text: `Nagraj self-tape do „${c.title}”${when}`, min: 45 });
  }
  for (const item of inbox.filter((x) => x.state === 'new' && x.deadline)) {
    const left = daysBetween(day, item.deadline);
    if (left < 0 || left > 3) continue;
    tasks.push({ id: `${day}:decide:${item.id}`, date: day, kind: 'casting', area: 'casting', ref: item.id, text: `Zdecyduj o „${item.title}” — deadline ${relDays(item.deadline, day)}`, min: 10 });
  }
  return tasks.slice(0, 2);
}

// Gdy jest self-tape do nagrania, rozwojowy składnik jest jeden; inaczej pełna porcja.
export function devCountFor(fromCastings) {
  if (fromCastings.some((t) => t.id.includes(':selftape:'))) return 1;
  return fromCastings.length ? TASKS_PER_DAY - 1 : TASKS_PER_DAY;
}
