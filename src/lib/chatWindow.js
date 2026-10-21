// Które wiadomości idą do API. Historia jest tylko dopisywana (append-only), a okno
// przesuwa się skokowo — dzięki temu prefiks rozmowy się nie zmienia i cache działa.
import { CHAT } from '../config.js';

export const inWindow = (messages, windowStart = 0) => messages.filter((m) => m.id >= windowStart && !m.failed);

// Przed wysłaniem nowej wiadomości: czy okno trzeba przesunąć?
export function nextWindowStart(messages, windowStart = 0, { windowMax, windowKeep } = CHAT) {
  const current = inWindow(messages, windowStart);
  if (current.length + 1 <= windowMax) return windowStart;
  const kept = current.slice(-(windowKeep - 1));
  const firstUser = kept.find((m) => m.role === 'user');
  return firstUser ? firstUser.id : current.at(-1).id + 1;
}

// Kontekst dnia dołączamy tylko wtedy, gdy się zmienił albo wypadł z okna.
export function needsContext(windowMessages, context) {
  const last = windowMessages.findLast((m) => m.context);
  return !last || last.context !== context;
}

export const toApiMessages = (windowMessages) =>
  windowMessages.map((m) => ({
    role: m.role,
    content: [...(m.context ? [{ type: 'text', text: m.context }] : []), { type: 'text', text: m.text }],
  }));
