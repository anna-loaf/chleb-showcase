import { db, changed, nowIso } from '../db/db.js';
import { castingTasks, devCountFor, planDevTasks, swapped } from '../lib/tasks.js';
import { listCastings, listInbox } from './castings.js';

// Zadania na dany dzień: rozwojowe zapisujemy przy pierwszym otwarciu dnia (zostają stałe),
// castingowe liczymy na bieżąco z historii i Świeżych z pieca.
export async function tasksForDay(day) {
  const d = await db();
  const [castings, inbox, stored] = await Promise.all([listCastings(), listInbox(), d.getAllFromIndex('tasks', 'date', day)]);
  const fromCastings = castingTasks({ castings, inbox, day });

  let dev = stored.filter((t) => t.kind === 'dev');
  if (!dev.length) {
    dev = planDevTasks(day, devCountFor(fromCastings));
    const tx = d.transaction('tasks', 'readwrite');
    await Promise.all([...dev.map((t) => tx.store.put(t)), tx.done]);
  }

  const storedCasting = new Map(stored.filter((t) => t.kind === 'casting').map((t) => [t.id, t]));
  const live = fromCastings.map((t) => ({ ...t, done: storedCasting.get(t.id)?.done ?? false }));
  for (const t of storedCasting.values()) if (t.done && !live.some((l) => l.id === t.id)) live.push(t);
  return [...live, ...dev.sort((a, b) => a.id.localeCompare(b.id))];
}

export const tasksOn = async (day) => (await db()).getAllFromIndex('tasks', 'date', day);

export async function toggleTask(task) {
  const done = !task.done;
  await (await db()).put('tasks', { ...task, done, doneAt: done ? nowIso() : null });
  changed('tasks');
}

export async function swapTask(task) {
  await (await db()).put('tasks', swapped(task));
  changed('tasks');
}
