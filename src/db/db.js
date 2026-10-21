// IndexedDB — wszystkie dane zostają na telefonie.
import { openDB } from 'idb';

export const STORES = ['castings', 'inbox', 'tasks', 'chat', 'settings', 'usage'];

let dbPromise;
export function db() {
  dbPromise ??= openDB('chleb', 1, {
    upgrade(d) {
      d.createObjectStore('castings', { keyPath: 'id' });
      d.createObjectStore('inbox', { keyPath: 'id' });
      d.createObjectStore('tasks', { keyPath: 'id' }).createIndex('date', 'date');
      d.createObjectStore('chat', { keyPath: 'id', autoIncrement: true });
      d.createObjectStore('settings');
      d.createObjectStore('usage', { keyPath: 'month' });
    },
  });
  return dbPromise;
}

// Proste „na żywo”: po zapisie widoki, które czytają dany magazyn, odświeżają się same.
const listeners = new Set();
export const changed = (...stores) => listeners.forEach((fn) => fn(stores));
export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();
