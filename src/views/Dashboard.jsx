// Piec — pulpit. Kolejność od góry: pop-up, Świeże z pieca, Składniki na dziś,
// Zagadaj do Chleba, Co się piecze w Krakowie, Spiżarnia.
import { useEffect, useState } from 'react';
import { useLive } from '../db/useLive.js';
import { getSettings, setSetting } from '../data/settings.js';
import { applyFromInbox, dismissInbox, listCastings, listInbox, restoreInbox, undoApply } from '../data/castings.js';
import { swapTask, tasksForDay, tasksOn, toggleTask } from '../data/tasks.js';
import { addDays, dayKey, daysBetween, fmtShort, relDays } from '../lib/dates.js';
import { buildWelcome } from '../lib/welcome.js';
import { AREAS } from '../lib/content/taskBank.js';
import { detectPush } from '../lib/pushSupport.js';
import { go } from '../lib/router.js';
import { WELCOME_ONCE_PER_DAY } from '../config.js';
import { Icon } from '../components/Icon.jsx';
import { BreadMark } from '../components/BreadMark.jsx';
import { Reasons, Section, VerdictBadge } from '../components/ui.jsx';
import { Stats } from '../components/Stats.jsx';
import { useToast } from '../components/Toast.jsx';
import { PasteSheet, askAboutDraft } from './PasteSheet.jsx';
import { EventsPreview } from './Events.jsx';

export function Dashboard() {
  const today = dayKey();
  const settings = useLive(getSettings, ['settings']);
  const castings = useLive(listCastings, ['castings']);
  const inbox = useLive(listInbox, ['inbox']);
  const tasks = useLive(() => tasksForDay(today), ['tasks', 'castings', 'inbox'], [today]);

  return (
    <>
      <InstallHint settings={settings} />
      <WelcomePopup today={today} settings={settings} castings={castings} />
      <FreshSection inbox={inbox} today={today} limit={3} />
      <TasksSection tasks={tasks} />
      <ChatShortcut />
      <EventsPreview />
      <Section id="pantry" name="Spiżarnia" meaning="historia castingów i statystyki" action={<OpenLink route="spizarnia" label="Otwórz Spiżarnię" />}>
        <Stats castings={castings ?? []} />
        {castings && !castings.length ? <p className="empty" style={{ marginTop: 12 }}>Pusta spiżarnia. Pierwsze „Zgłosiłam się” i zacznie się zapełniać.</p> : null}
      </Section>
    </>
  );
}

function OpenLink({ route, label }) {
  return (
    <a className="icon-button" href={`#/${route}`} aria-label={label}>
      <Icon name="chevron" size={20} />
    </a>
  );
}

// ── Pop-up powitalny ─────────────────────────────────────────────────────
function WelcomePopup({ today, settings, castings }) {
  const [message, setMessage] = useState(null);
  const due = settings && castings && (!WELCOME_ONCE_PER_DAY || settings.lastWelcome !== today);

  useEffect(() => {
    if (!due || message) return;
    let alive = true;
    tasksOn(addDays(today, -1)).then((tasks) => {
      if (!alive) return;
      if (!settings.lastWelcome && !castings.length) {
        setMessage({
          kind: 'first',
          title: 'Cześć, tu Chleb!',
          body: 'Jestem Twoim agentem aktorskim. Codziennie dam Ci konkretne składniki do zrobienia, ocenię ogłoszenia i przypilnuję zgłoszeń. Zacznij od Receptury — im więcej o Tobie wiem, tym celniej doradzę.',
          extra: '',
        });
      } else {
        setMessage(buildWelcome({ today, castings, tasks }));
      }
    });
    return () => {
      alive = false;
    };
  }, [due, message, today, settings, castings]);

  if (!due || !message) return null;
  const close = () => setSetting('lastWelcome', today);
  const kicker = { praise: 'Za wczoraj', motivation: 'Na dziś', fact: 'Ciekawostka', first: 'Witaj w piekarni' }[message.kind];
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <BreadMark size={56} decorative />
        <p className="kicker">{kicker}</p>
        <h2 id="welcome-title">{message.title}</h2>
        <p>{message.body}</p>
        {message.extra ? <p className="extra">{message.extra}</p> : null}
        <button type="button" className="btn btn-primary btn-block" onClick={close} autoFocus>
          Do roboty!
        </button>
      </div>
    </div>
  );
}

// ── Podpowiedź instalacji (iPhone w Safari) ─────────────────────────────
function InstallHint({ settings }) {
  const [push] = useState(detectPush);
  if (!settings || settings.installHintHidden || push.state !== 'install') return null;
  return (
    <div className="banner">
      <Icon name="download" size={20} />
      <div>
        <strong>Dodaj Chleba do ekranu początkowego</strong>
        <p className="small">W Safari tapnij Udostępnij → „Do ekranu początkowego”. Wtedy apka działa offline, a w Etapie 2 dostaniesz powiadomienia o castingach.</p>
      </div>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => setSetting('installHintHidden', true)}>
        Ukryj
      </button>
    </div>
  );
}

// ── Świeże z pieca ───────────────────────────────────────────────────────
export function FreshSection({ inbox, today, limit, unsure = false }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const toast = useToast();
  const items = (inbox ?? []).filter((i) => i.state === 'new' && (i.verdict === 'unsure') === unsure);

  const apply = async (item) => {
    const casting = await applyFromInbox(item.id);
    toast('Zapisane w Spiżarni jako Zaczyn (zgłoszona).', { label: 'Cofnij', run: () => undoApply(item.id, casting.id) });
  };
  const dismiss = async (item) => {
    await dismissInbox(item.id);
    toast('Odpuszczone.', { label: 'Cofnij', run: () => restoreInbox(item.id) });
  };

  return (
    <Section
      id={unsure ? 'unsure' : 'fresh'}
      name={unsure ? 'Znaki zapytania' : 'Świeże z pieca'}
      meaning={unsure ? 'Chleb nie jest pewien, czy to ogłoszenie dla Ciebie — przejrzyj bez pośpiechu' : 'nowe castingi — czekają na Twoją decyzję'}
      action={
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setPasteOpen(true)}>
          <Icon name="paste" size={18} />
          Wklej
        </button>
      }
    >
      {inbox && !items.length && unsure ? (
        <p className="empty">Pusto — Chleb jest pewien wszystkiego, co znalazł.</p>
      ) : inbox && !items.length ? (
        <p className="empty">
          Piec pusty. Castingi same wpadną tu po skanie maila (Etap 2). Na razie wklej ogłoszenie — Chleb od razu oceni, czy pasuje i czy to nie oszustwo.
        </p>
      ) : (
        <div className="stack">
          {(limit ? items.slice(0, limit) : items).map((item) => (
            <FreshItem
              key={item.id}
              item={item}
              today={today}
              open={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              onApply={() => apply(item)}
              onDismiss={() => dismiss(item)}
            />
          ))}
          {limit && items.length > limit ? (
            <a className="btn btn-ghost btn-block" href="#/role">
              Więcej ról ({items.length}) →
            </a>
          ) : null}
        </div>
      )}
      {pasteOpen ? <PasteSheet onClose={() => setPasteOpen(false)} /> : null}
    </Section>
  );
}

function FreshItem({ item, today, open, onToggle, onApply, onDismiss }) {
  const left = item.deadline ? daysBetween(today, item.deadline) : null;
  const scam = item.verdict === 'scam';
  return (
    <article className="fresh-item" aria-labelledby={`fresh-${item.id}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <VerdictBadge verdict={item.verdict} />
        {item.deadline ? (
          <span className={`deadline${left >= 0 && left <= 2 ? ' soon' : ''}${left < 0 ? ' past' : ''}`}>
            <Icon name="clock" size={15} />
            deadline {fmtShort(item.deadline)} · {relDays(item.deadline, today)}
          </span>
        ) : (
          <span className="deadline">bez terminu</span>
        )}
      </div>
      <h3 className="fresh-title" id={`fresh-${item.id}`}>
        {item.title}
      </h3>
      <p className="casting-meta">{[item.source, item.castingDirector].filter(Boolean).join(' · ')}</p>
      {scam ? <p className="banner danger small">Chleb odradza: możliwe oszustwo. Nie wysyłaj pieniędzy ani danych osobowych.</p> : null}
      <Reasons reasons={item.reasons} limit={open ? undefined : 3} />
      {open ? (
        <div className="stack">
          {item.text ? <div className="ad-text">{item.text}</div> : null}
          {item.contact ? <p className="small">Kontakt: {item.contact}</p> : null}
          {item.link ? (
            <a className="small" href={item.link} target="_blank" rel="noopener noreferrer">
              Otwórz ogłoszenie ↗
            </a>
          ) : null}
          <button type="button" className="btn btn-secondary btn-small" onClick={() => go('czat', { draft: askAboutDraft(item) })}>
            <Icon name="chat" size={18} />
            Zapytaj Chleba o to ogłoszenie
          </button>
        </div>
      ) : null}
      <div className="fresh-actions">
        <button type="button" className={`btn ${scam ? 'btn-secondary' : 'btn-primary'}`} onClick={onApply}>
          <Icon name="check" size={18} />
          Zgłosiłam się
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDismiss}>
          Odpuszczam
        </button>
        <button type="button" className="btn btn-ghost" aria-expanded={open} onClick={onToggle}>
          {open ? 'Zwiń' : 'Szczegóły'}
        </button>
      </div>
    </article>
  );
}

// ── Składniki na dziś ────────────────────────────────────────────────────
function TasksSection({ tasks }) {
  const done = tasks?.filter((t) => t.done).length ?? 0;
  return (
    <Section id="tasks" name="Składniki na dziś" meaning="zadania na dziś — mały, konkretny krok do przodu">
      {tasks?.map((t) => (
        <div key={t.id} className={`task${t.done ? ' done' : ''}`}>
          <button
            type="button"
            className="check"
            role="checkbox"
            aria-checked={t.done}
            aria-labelledby={`task-${t.id}`}
            onClick={() => toggleTask(t)}
          >
            {t.done ? <Icon name="check" size={18} strokeWidth={2.6} /> : null}
          </button>
          <div className="task-body">
            <p className="task-text" id={`task-${t.id}`}>
              {t.text}
            </p>
            <p className="task-meta">
              {t.area === 'casting' ? 'Casting' : AREAS[t.area]} · ok. {t.min} min
            </p>
          </div>
          {t.kind === 'dev' && !t.done ? (
            <button type="button" className="task-swap" aria-label="Inny składnik z tego obszaru" onClick={() => swapTask(t)}>
              <Icon name="swap" size={18} />
            </button>
          ) : null}
        </div>
      ))}
      {tasks ? (
        <p className="progress-line">{done === tasks.length ? 'Wszystko odhaczone — piec rozgrzany. Jutro Chleb to doceni.' : `Odhaczone: ${done} z ${tasks.length}`}</p>
      ) : null}
    </Section>
  );
}

// ── Zagadaj do Chleba (skrót) ────────────────────────────────────────────
const QUICK = ['Co dziś zrobić dla kariery?', 'Do której agencji się zgłosić?', 'Jak nagrać dobry self-tape?'];

function ChatShortcut() {
  const [text, setText] = useState('');
  const send = (e) => {
    e.preventDefault();
    if (text.trim()) go('czat', { draft: text.trim(), autoSend: true });
  };
  return (
    <Section id="talk" name="Zagadaj do Chleba" meaning="czat z Twoim agentem — szczerze i konkretnie">
      <form className="composer" onSubmit={send}>
        <label className="visually-hidden" htmlFor="quick-msg">
          Wiadomość do Chleba
        </label>
        <textarea
          id="quick-msg"
          className="textarea"
          rows={1}
          value={text}
          placeholder="Napisz, o co chcesz zapytać…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia('(pointer: coarse)').matches) send(e);
          }}
        />
        <button className="send" type="submit" disabled={!text.trim()} aria-label="Wyślij do Chleba">
          <Icon name="send" />
        </button>
      </form>
      <div className="quick">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip" onClick={() => go('czat', { draft: q, autoSend: true })}>
            {q}
          </button>
        ))}
      </div>
    </Section>
  );
}
