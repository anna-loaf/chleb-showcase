// JEDYNE miejsce w apce, które rozmawia z /api/chat (serwer → Claude API).
// Tu też decyzja, który model odpowiada: `pickTier`.

export class ChlebError extends Error {
  constructor(kind, message, partial = '') {
    super(message);
    this.kind = kind;
    this.partial = partial;
  }
}

// Tańszy model (Haiku) tylko dla krótkich, prostych wiadomości — i tylko gdy włączysz
// go w Zapleczu. Uwaga: zmiana modelu w trakcie rozmowy gubi cache, więc oszczędność
// jest mniejsza niż różnica w cenniku.
const SIMPLE_MAX_CHARS = 140;
const NEEDS_MAIN = /ogłosz|casting|oszust|sprawd|agencj|self-?tape|egzamin|monolog|scen|rol[aęi]|plan|przygotuj|analiz|popraw|napisz|mail|cv|zgłosz/i;

export function pickTier(text, { lightEnabled = false } = {}) {
  if (!lightEnabled) return 'main';
  const t = String(text).trim();
  return t.length <= SIMPLE_MAX_CHARS && !NEEDS_MAIN.test(t) ? 'light' : 'main';
}

async function post(body, token, signal) {
  try {
    return await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { 'x-chleb-token': token } : {}) },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw new ChlebError('aborted', 'Przerwano.');
    throw new ChlebError('network', 'Brak połączenia z serwerem Chleba.');
  }
}

async function failFrom(res) {
  const data = await res.json().catch(() => ({}));
  return new ChlebError(data.kind ?? 'http', data.message ?? `Błąd serwera (${res.status}).`);
}

export async function askChleb({ tier = 'main', system, messages, token, onText, signal }) {
  const res = await post({ tier, system, messages }, token, signal);
  if (!res.ok) throw await failFrom(res);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let text = '';
  let done = null;
  try {
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      buffer += value;
      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        const event = JSON.parse(line);
        if (event.t === 'text') {
          text += event.v;
          onText?.(text);
        } else if (event.t === 'done') done = event;
        else if (event.t === 'error') throw new ChlebError(event.kind, event.message, text);
      }
    }
  } catch (err) {
    if (err instanceof ChlebError) throw err;
    if (err?.name === 'AbortError') throw new ChlebError('aborted', 'Przerwano.', text);
    throw new ChlebError('network', 'Połączenie urwało się w trakcie odpowiedzi.', text);
  }
  if (!done) throw new ChlebError('network', 'Połączenie urwało się w trakcie odpowiedzi.', text);
  return { text, model: done.model, stop: done.stop, usage: done.usage };
}

// „Sprawdź połączenie” — weryfikuje hasło i obecność klucza, nie woła modelu (0 zł).
export async function pingChleb(token) {
  const res = await post({ ping: true }, token);
  if (!res.ok) throw await failFrom(res);
  return res.json();
}
