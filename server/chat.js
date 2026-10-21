// JEDYNE miejsce, które woła Claude API. Działa jako funkcja Vercel (api/chat.js)
// i lokalnie przez vite.config.js. Klucz API żyje tylko tutaj — nigdy w przeglądarce.
import Anthropic, {
  APIConnectionError,
  APIError,
  APIUserAbortError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  RateLimitError,
} from '@anthropic-ai/sdk';
import { createHash, timingSafeEqual } from 'node:crypto';
import { MODELS } from '../shared/models.js';

// Bezpieczniki kosztów: nawet przy błędzie w apce jedno zapytanie nie urośnie ponad to.
export const LIMITS = { messages: 40, chars: 60_000, systemBlocks: 4 };

const json = (status, data) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const sha = (s) => createHash('sha256').update(String(s)).digest();

function checkAccess(request, env) {
  const expected = env.CHLEB_ACCESS_TOKEN;
  if (!expected) {
    if (env.CHLEB_DEV === '1') return null; // lokalnie (npm run dev) hasło jest opcjonalne
    return json(500, { kind: 'config', message: 'Na serwerze brakuje CHLEB_ACCESS_TOKEN (Vercel → Settings → Environment Variables).' });
  }
  const given = request.headers.get('x-chleb-token') ?? '';
  if (!timingSafeEqual(sha(given), sha(expected))) {
    return json(401, { kind: 'token', message: 'Złe hasło dostępu. Sprawdź je w Zapleczu.' });
  }
  return null;
}

// Treść wiadomości zawsze w tej samej postaci (lista bloków tekstu), żeby prefiks
// rozmowy był identyczny między zapytaniami — inaczej cache promptu przestaje działać.
export function validate(body) {
  const tier = body?.tier === 'light' ? 'light' : 'main';
  const rawSystem = Array.isArray(body?.system) ? body.system : [];
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  if (!rawMessages.length) return { error: 'Brak wiadomości.' };
  if (rawMessages.length > LIMITS.messages) return { error: `Za długa rozmowa (max ${LIMITS.messages} wiadomości) — zacznij nową.` };
  if (rawSystem.length > LIMITS.systemBlocks) return { error: 'Za dużo bloków systemowych.' };

  let chars = 0;
  const system = rawSystem
    .map((b) => ({ text: String(b?.text ?? ''), cache: Boolean(b?.cache) }))
    .filter((b) => b.text.trim())
    .map(({ text, cache }) => {
      chars += text.length;
      return cache ? { type: 'text', text, cache_control: { type: 'ephemeral' } } : { type: 'text', text };
    });

  const messages = [];
  for (const m of rawMessages) {
    if (m?.role !== 'user' && m?.role !== 'assistant') return { error: 'Nieznana rola wiadomości.' };
    const parts = (typeof m.content === 'string' ? [m.content] : Array.isArray(m.content) ? m.content.map((p) => p?.text) : [])
      .map((t) => String(t ?? ''))
      .filter((t) => t.trim());
    if (!parts.length) return { error: 'Pusta wiadomość.' };
    chars += parts.reduce((sum, t) => sum + t.length, 0);
    messages.push({ role: m.role, content: parts.map((text) => ({ type: 'text', text })) });
  }
  if (messages[0].role !== 'user') return { error: 'Rozmowa musi zaczynać się od Twojej wiadomości.' };
  if (chars > LIMITS.chars) return { error: 'Za długi tekst — skróć wiadomość albo zacznij nową rozmowę.' };
  return { tier, system, messages };
}

export function describeError(err) {
  if (err instanceof APIUserAbortError) return { kind: 'aborted', message: 'Przerwano.' };
  if (err instanceof APIConnectionError) return { kind: 'network', message: 'Serwer nie połączył się z API Anthropic. Spróbuj za chwilę.' };
  if (err instanceof APIError) {
    const apiMessage = err.error?.error?.message ?? '';
    if (err instanceof AuthenticationError) return { kind: 'auth', message: 'Klucz API jest nieprawidłowy albo wyłączony (sprawdź ANTHROPIC_API_KEY).' };
    if (err instanceof RateLimitError) {
      if (err.error?.error?.details?.error_code === 'enforced_spend_limit_reached') {
        return { kind: 'limit', message: 'Konto API osiągnęło miesięczny limit swojego poziomu. Chleb wróci 1. dnia miesiąca.' };
      }
      return { kind: 'rate', message: 'Za dużo zapytań naraz — odczekaj chwilę.' };
    }
    if (err.status === 402 || err.type === 'billing_error') return { kind: 'billing', message: 'Brak środków na koncie API albo problem z płatnością (Console → Billing).' };
    // Dokumentacja: limit ustawiony przez Ciebie zwraca 400 z komunikatem „You have reached your specified…”.
    if (err instanceof BadRequestError && apiMessage.startsWith('You have reached your specified')) {
      return { kind: 'limit', message: 'Osiągnięty Twój limit wydatków z konsoli. Chleb odpoczywa do 1. dnia przyszłego miesiąca (albo podnieś limit).' };
    }
    if (err instanceof InternalServerError) return { kind: 'overloaded', message: 'API jest chwilowo przeciążone — spróbuj za minutę.' };
    return { kind: 'api', message: apiMessage || `Błąd API (${err.status}).` };
  }
  return { kind: 'server', message: 'Coś poszło nie tak po stronie serwera.' };
}

const pickUsage = (u = {}) => ({
  input_tokens: u.input_tokens ?? 0,
  output_tokens: u.output_tokens ?? 0,
  cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
  cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
  cache_creation: u.cache_creation ?? null,
});

// Strumień do apki: jedna linia JSON na zdarzenie (tekst → koniec z usage → albo błąd).
function toNdjson(stream) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') send({ t: 'text', v: event.delta.text });
        }
        const message = await stream.finalMessage();
        send({ t: 'done', model: message.model, stop: message.stop_reason, usage: pickUsage(message.usage) });
      } catch (err) {
        send({ t: 'error', ...describeError(err) });
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });
}

export async function handleChat(request, env = process.env) {
  if (request.method !== 'POST') return json(405, { kind: 'method', message: 'Tylko POST.' });
  const denied = checkAccess(request, env);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { kind: 'bad_request', message: 'Niepoprawny JSON.' });
  }

  // „Sprawdź połączenie” w Zapleczu — nic nie kosztuje, nie woła modelu.
  if (body?.ping) return json(200, { ok: true, hasKey: Boolean(env.ANTHROPIC_API_KEY), models: { main: MODELS.main.id, light: MODELS.light.id } });

  if (!env.ANTHROPIC_API_KEY) return json(500, { kind: 'config', message: 'Na serwerze brakuje ANTHROPIC_API_KEY.' });
  const req = validate(body);
  if (req.error) return json(400, { kind: 'bad_request', message: req.error });

  const tier = MODELS[req.tier];
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
  const stream = client.messages.stream({
    model: tier.id,
    max_tokens: tier.maxTokens,
    system: req.system,
    messages: req.messages,
    cache_control: { type: 'ephemeral' }, // automatyczny cache rosnącej rozmowy
    ...tier.params,
  });
  return new Response(toNdjson(stream), {
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' },
  });
}
