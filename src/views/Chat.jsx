// Zagadaj do Chleba — czat. Wysyłka: kontekst dnia + okno historii → /api/chat (strumień).
import { useEffect, useRef, useState } from 'react';
import { useLive } from '../db/useLive.js';
import { getSettings, setSetting } from '../data/settings.js';
import { addMessage, clearChat, deleteMessage, getUsage, listChat, recordUsage, updateMessage } from '../data/chat.js';
import { listCastings, listInbox } from '../data/castings.js';
import { tasksForDay } from '../data/tasks.js';
import { askChleb, pickTier } from '../lib/ai.js';
import { buildSystem, renderContext } from '../lib/prompt.js';
import { inWindow, needsContext, nextWindowStart, toApiMessages } from '../lib/chatWindow.js';
import { fmtPln, usdToPln } from '../lib/costs.js';
import { dayKey } from '../lib/dates.js';
import { go, takeParams } from '../lib/router.js';
import { BUDGET } from '../config.js';
import { MODELS } from '../../shared/models.js';
import { BreadMark } from '../components/BreadMark.jsx';
import { Icon } from '../components/Icon.jsx';
import { Markdown } from '../components/Markdown.jsx';
import { useToast } from '../components/Toast.jsx';

const STARTERS = [
  'Co dziś zrobić dla kariery?',
  'Do której agencji zgłosić się najpierw i jak?',
  'Pomóż mi przygotować self-tape',
  'Jak przygotować się do egzaminów do szkoły teatralnej?',
];

export function Chat() {
  const messages = useLive(listChat, ['chat']);
  const settings = useLive(getSettings, ['settings']);
  const usage = useLive(() => getUsage(), ['usage']);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [streamText, setStreamText] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const autoSend = useRef(null);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const p = takeParams();
    if (!p?.draft) return;
    if (p.autoSend) autoSend.current = p.draft;
    else {
      setDraft(p.draft);
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length, streamText]);

  const budget = settings?.budget ?? BUDGET;
  const spent = usage ? usdToPln(usage.usd, budget) : 0;
  const ratio = spent / budget.monthlyPln;
  const needsToken = !import.meta.env.DEV && settings && !settings.token;
  const blocked = !online || needsToken || ratio >= 1;

  async function send(textArg) {
    const text = String(textArg ?? draft).trim();
    if (!text || busy || !settings) return;
    if (!online) return toast('Jesteś offline — Chleb odpowie, gdy wrócisz do sieci.');
    if (needsToken) return toast('Najpierw wpisz hasło dostępu w Zapleczu.');
    if (ratio >= 1) return toast('Budżet na ten miesiąc wyczerpany (wg licznika w apce).');

    setDraft('');
    setBusy(true);
    const today = dayKey();
    const [castings, inbox, tasks, all] = await Promise.all([listCastings(), listInbox(), tasksForDay(today), listChat()]);
    const start = nextWindowStart(all, settings.chatWindowStart);
    if (start !== settings.chatWindowStart) await setSetting('chatWindowStart', start);
    const windowMessages = inWindow(all, start);
    const context = renderContext({ today, tasks, inbox, castings });
    const userMessage = { role: 'user', text, ...(needsContext(windowMessages, context) ? { context } : {}) };
    const id = await addMessage(userMessage);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreamText('');
    try {
      const result = await askChleb({
        tier: pickTier(text, { lightEnabled: settings.lightModel }),
        system: buildSystem(settings.knowledge),
        messages: toApiMessages([...windowMessages, { ...userMessage, id }]),
        token: settings.token,
        signal: controller.signal,
        onText: setStreamText,
      });
      await recordUsage(result.model, result.usage);
      if (result.stop === 'refusal' || !result.text.trim()) {
        await updateMessage(id, { failed: true, error: 'Chleb nie może odpowiedzieć na tę wiadomość — spróbuj ująć to inaczej.' });
      } else {
        await addMessage({ role: 'assistant', text: result.text, model: result.model, truncated: result.stop === 'max_tokens' });
      }
    } catch (err) {
      await updateMessage(id, { failed: true, error: err.message });
    } finally {
      abortRef.current = null;
      setStreamText(null);
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoSend.current && settings && messages) {
      const text = autoSend.current;
      autoSend.current = null;
      send(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, messages]);

  const retry = async (m) => {
    await deleteMessage(m.id);
    send(m.text);
  };

  const newConversation = async () => {
    if (window.confirm('Zacząć nową rozmowę? Obecna zniknie z czatu (Twoje dane w Spiżarni i Recepturze zostają).')) await clearChat();
  };

  const modelLabel = settings?.lightModel ? `${MODELS.main.label} + ${MODELS.light.label}` : MODELS.main.label;

  return (
    <div className="chat">
      {needsToken ? (
        <div className="banner warn">
          <Icon name="alert" size={20} />
          <div>
            <strong>Brakuje hasła dostępu.</strong>
            <p className="small">Wpisz je raz w Zapleczu — to samo, które ustawiłaś na Vercelu (CHLEB_ACCESS_TOKEN).</p>
          </div>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => go('zaplecze')}>
            Zaplecze
          </button>
        </div>
      ) : null}
      {!online ? (
        <div className="banner warn">
          <Icon name="alert" size={20} />
          <div>Jesteś offline. Czat potrzebuje internetu — reszta apki działa bez sieci.</div>
        </div>
      ) : null}

      {messages?.length ? (
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-small" onClick={newConversation} disabled={busy}>
            <Icon name="plus" size={16} />
            Nowa rozmowa
          </button>
        </div>
      ) : null}

      <div className="msg chleb">
        <BreadMark size={30} className="avatar" decorative />
        <div className="bubble">
          <p>Cześć! Tu Chleb. Pytaj o castingi, self-tape’y, agencje i egzaminy — albo wklej ogłoszenie, a sprawdzę, czy to nie naciąganie.</p>
        </div>
      </div>

      {messages?.map((m) =>
        m.role === 'user' ? (
          <div key={m.id}>
            <div className="msg user">
              <div className="bubble">{m.text}</div>
            </div>
            {m.failed ? (
              <p className="msg-failed">
                Nie wysłano: {m.error}{' '}
                <button type="button" onClick={() => retry(m)} disabled={busy}>
                  Spróbuj ponownie
                </button>
              </p>
            ) : null}
          </div>
        ) : (
          <div key={m.id} className="msg chleb">
            <BreadMark size={30} className="avatar" decorative />
            <div className="bubble">
              <Markdown text={m.text} />
              {m.truncated ? <p className="small muted">(odpowiedź ucięta — dopytaj „kontynuuj”)</p> : null}
            </div>
          </div>
        ),
      )}

      {streamText !== null ? (
        <div className="msg chleb" aria-live="polite">
          <BreadMark size={30} className="avatar" decorative />
          <div className="bubble">{streamText ? <Markdown text={streamText} /> : <span className="typing">Chleb zagniata odpowiedź…</span>}</div>
        </div>
      ) : null}

      {!messages?.length && streamText === null ? (
        <div className="quick">
          {STARTERS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={blocked || busy}>
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div ref={bottomRef} />

      <div className="chat-composer">
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label className="visually-hidden" htmlFor="chat-input">
            Wiadomość do Chleba
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            className="textarea"
            rows={draft.includes('\n') ? 4 : 1}
            value={draft}
            placeholder="Napisz do Chleba…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia('(pointer: coarse)').matches) {
                e.preventDefault();
                send();
              }
            }}
          />
          {busy ? (
            <button type="button" className="send" onClick={() => abortRef.current?.abort()} aria-label="Przerwij odpowiedź">
              <Icon name="close" />
            </button>
          ) : (
            <button className="send" type="submit" disabled={!draft.trim() || blocked} aria-label="Wyślij do Chleba">
              <Icon name="send" />
            </button>
          )}
        </form>
        <p className={`budget-line${ratio >= BUDGET.warnAt ? ' warn' : ''}`}>
          <span>
            Ten miesiąc: {fmtPln(spent)} z {fmtPln(budget.monthlyPln)}
            {ratio >= 1 ? ' — budżet wyczerpany' : ratio >= BUDGET.warnAt ? ' — zbliżasz się do limitu' : ''}
          </span>
          <span>{modelLabel}</span>
        </p>
      </div>
    </div>
  );
}
