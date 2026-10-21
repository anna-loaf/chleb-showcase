// Zaplecze — ustawienia: połączenie, budżet i zużycie, model, powiadomienia, kopia danych.
import { useEffect, useRef, useState } from 'react';
import { useLive } from '../db/useLive.js';
import { getSettings, setSetting } from '../data/settings.js';
import { getUsage } from '../data/chat.js';
import { exportAll, importAll, shareOrDownload } from '../data/backup.js';
import { pingChleb } from '../lib/ai.js';
import { fmtPln, usdToPln } from '../lib/costs.js';
import { detectPush } from '../lib/pushSupport.js';
import { subscribePush } from '../lib/push.js';
import { BUDGET } from '../config.js';
import { MODELS } from '../../shared/models.js';
import { Section } from '../components/ui.jsx';
import { Icon } from '../components/Icon.jsx';
import { useToast } from '../components/Toast.jsx';

const fmtInt = (n) => (n ?? 0).toLocaleString('pl-PL');

export function Settings() {
  const settings = useLive(getSettings, ['settings']);
  const usage = useLive(() => getUsage(), ['usage']);
  if (!settings) return null;
  return (
    <>
      <Section id="drawers" name="Szuflady" meaning="Twoje dane: historia castingów i baza wiedzy">
        <div className="stack">
          <a className="btn btn-secondary btn-block" href="#/spizarnia">
            <Icon name="jar" size={18} />
            Spiżarnia — historia castingów i statystyki
          </a>
          <a className="btn btn-secondary btn-block" href="#/receptura">
            <Icon name="book" size={18} />
            Receptura — baza wiedzy o Tobie
          </a>
        </div>
      </Section>
      <Connection settings={settings} />
      <Budget settings={settings} usage={usage} />
      <ModelChoice settings={settings} />
      <Notifications settings={settings} />
      <Data />
    </>
  );
}

function Connection({ settings }) {
  const [token, setToken] = useState(settings.token);
  const [state, setState] = useState(null);
  const dirty = token !== settings.token;

  const check = async () => {
    setState({ kind: 'busy', text: 'Sprawdzam…' });
    try {
      if (dirty) await setSetting('token', token.trim());
      const res = await pingChleb(token.trim());
      setState(
        res.hasKey
          ? { kind: 'ok', text: `Połączono. Chleb odpowiada modelem ${res.models.main}.` }
          : { kind: 'warn', text: 'Hasło OK, ale na serwerze brakuje ANTHROPIC_API_KEY (lokalnie działa tryb próbny).' },
      );
    } catch (err) {
      setState({ kind: 'error', text: err.message });
    }
  };

  return (
    <Section id="conn" name="Drzwi do piekarni" meaning="hasło dostępu do Twojego serwera czatu">
      <div className="stack">
        <div className="field">
          <label htmlFor="token">Hasło dostępu</label>
          <input
            id="token"
            className="input"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="to samo co CHLEB_ACCESS_TOKEN na Vercelu"
          />
          <span className="hint">Chroni Twój klucz API przed obcymi. Zostaje tylko na tym telefonie i nie trafia do kopii zapasowej.</span>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={check}>
            {dirty ? 'Zapisz i sprawdź' : 'Sprawdź połączenie'}
          </button>
        </div>
        {state ? (
          <p className={`banner ${state.kind === 'ok' ? '' : state.kind === 'error' ? 'danger' : 'warn'}`} aria-live="polite">
            {state.text}
          </p>
        ) : null}
        {import.meta.env.DEV ? <p className="small muted">Lokalnie (npm run dev) hasło nie jest wymagane, jeśli nie ustawiłaś go w .env.</p> : null}
      </div>
    </Section>
  );
}

function Budget({ settings, usage }) {
  const [form, setForm] = useState(settings.budget);
  const spent = usage ? usdToPln(usage.usd, settings.budget) : 0;
  const ratio = spent / settings.budget.monthlyPln;
  const level = ratio >= 1 ? 'over' : ratio >= BUDGET.warnAt ? 'warn' : '';

  useEffect(() => {
    const t = setTimeout(() => {
      const next = { monthlyPln: Number(form.monthlyPln) || BUDGET.monthlyPln, usdPln: Number(form.usdPln) || BUDGET.usdPln, vatPercent: Number(form.vatPercent) || 0 };
      if (JSON.stringify(next) !== JSON.stringify(settings.budget)) setSetting('budget', next);
    }, 600);
    return () => clearTimeout(t);
  }, [form, settings.budget]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(',', '.') }));

  return (
    <Section id="budget" name="Kasa piekarni" meaning="budżet i zużycie czatu w tym miesiącu">
      <div className="stack">
        <div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{fmtPln(spent)}</strong>
            <span className="small muted">z {fmtPln(settings.budget.monthlyPln)}</span>
          </div>
          <div className={`meter ${level}`} role="meter" aria-valuemin={0} aria-valuemax={settings.budget.monthlyPln} aria-valuenow={Number(spent.toFixed(2))} aria-label="Wydatki na czat w tym miesiącu">
            <span style={{ width: `${Math.min(100, ratio * 100)}%` }} />
          </div>
          <p className="small muted" style={{ marginTop: 6 }}>
            {ratio >= 1
              ? 'Budżet wyczerpany — czat jest wstrzymany do 1. dnia miesiąca (albo podnieś budżet poniżej).'
              : `Szacunek z licznika w apce (z ${settings.budget.vatPercent}% VAT). Twardy limit trzyma konsola Anthropic.`}
          </p>
        </div>
        <dl className="kv">
          <dt>Wiadomości do Chleba</dt>
          <dd>{fmtInt(usage?.requests)}</dd>
          <dt>Tokeny wejścia (pełna cena)</dt>
          <dd>{fmtInt(usage?.input)}</dd>
          <dt>Tokeny z cache (−90%)</dt>
          <dd>{fmtInt(usage?.cacheRead)}</dd>
          <dt>Zapis do cache</dt>
          <dd>{fmtInt(usage?.cacheWrite)}</dd>
          <dt>Tokeny wyjścia</dt>
          <dd>{fmtInt(usage?.output)}</dd>
          <dt>Koszt API (bez VAT)</dt>
          <dd>${(usage?.usd ?? 0).toFixed(3)}</dd>
        </dl>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="b-pln">Budżet (zł/mies.)</label>
            <input id="b-pln" className="input" inputMode="decimal" value={form.monthlyPln} onChange={set('monthlyPln')} />
          </div>
          <div className="field">
            <label htmlFor="b-rate">Kurs USD → zł</label>
            <input id="b-rate" className="input" inputMode="decimal" value={form.usdPln} onChange={set('usdPln')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="b-vat">VAT doliczany przez Anthropic (%)</label>
          <input id="b-vat" className="input" inputMode="numeric" value={form.vatPercent} onChange={set('vatPercent')} />
          <span className="hint">Osobom prywatnym w Polsce doliczane jest 23%. Sprawdź na pierwszej fakturze.</span>
        </div>
      </div>
    </Section>
  );
}

function ModelChoice({ settings }) {
  return (
    <Section id="model" name="Mąka" meaning="który model odpowiada w czacie">
      <div className="stack">
        <p className="small">
          Główny: <strong>{MODELS.main.label}</strong> — wszystkie rozmowy.
        </p>
        <label className="switch">
          <input type="checkbox" checked={settings.lightModel} onChange={(e) => setSetting('lightModel', e.target.checked)} />
          <span>
            <strong>Tańszy model do prostych pytań</strong>
            <br />
            <span className="small muted">
              Krótkie, proste wiadomości („dzięki”, „ok, a jutro?”) pójdą do {MODELS.light.label} (o połowę tańszy). Ogłoszenia, agencje, sceny i plany zawsze
              dostaje Sonnet. Włącz, gdy licznik zbliża się do budżetu — zmiana modelu gubi cache, więc zysk jest mniejszy niż różnica w cenie.
            </span>
          </span>
        </label>
      </div>
    </Section>
  );
}

const PUSH_TEXT = {
  ready: 'Ten telefon obsłuży powiadomienia. Włączymy je w Etapie 2 (skan maila → push tylko z trafieniami, 3× dziennie).',
  install: 'Na iPhonie powiadomienia działają dopiero, gdy Chleb jest dodany do ekranu początkowego (Safari → Udostępnij → „Do ekranu początkowego”) i otwarty z ikony.',
  unsupported: 'Ta przeglądarka nie obsługuje powiadomień web push. Nowe castingi i tak zobaczysz w „Świeżych z pieca” po otwarciu apki.',
};

function Notifications({ settings }) {
  const [push] = useState(detectPush);
  const [error, setError] = useState('');
  const toast = useToast();
  const enable = async () => {
    setError('');
    try {
      await setSetting('pushSubscription', await subscribePush());
    } catch (err) {
      setError(err.message);
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(settings.pushSubscription);
    toast('Skopiowane — wklej jako sekret PUSH_SUBSCRIPTION w GitHubie.');
  };
  return (
    <Section id="push" name="Dzwonek piekarza" meaning="powiadomienia o nowych castingach (3× dziennie)">
      <div className="stack">
        <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <Icon name="bell" size={20} />
          <p className="small">{push.state === 'ready' ? 'Chleb sprawdza skrzynkę castingową rano, w południe i wieczorem i daje znać tylko o trafieniach.' : PUSH_TEXT[push.state]}</p>
        </div>
        {push.state === 'ready' ? (
          <button type="button" className="btn btn-primary" onClick={enable}>
            {settings.pushSubscription ? 'Odnów powiadomienia' : 'Włącz powiadomienia'}
          </button>
        ) : null}
        {error ? <p className="banner danger small">{error}</p> : null}
        {settings.pushSubscription ? (
          <div className="stack">
            <p className="small">Powiadomienia włączone na tym telefonie. Jednorazowo skopiuj kod i wklej go w GitHubie jako sekret <strong>PUSH_SUBSCRIPTION</strong>.</p>
            <button type="button" className="btn btn-secondary" onClick={copy}>
              Kopiuj kod subskrypcji
            </button>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function Data() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [persisted, setPersisted] = useState(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const exportData = async () => {
    try {
      await shareOrDownload(await exportAll());
    } catch (err) {
      if (err?.name !== 'AbortError') toast(`Nie udało się: ${err.message}`);
    }
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (!window.confirm('Wczytać kopię? Obecne dane w apce zostaną ZASTĄPIONE danymi z pliku.')) return;
      await importAll(json);
      toast('Kopia wczytana.');
    } catch (err) {
      toast(`Nie udało się wczytać: ${err.message}`);
    }
  };

  return (
    <Section id="data" name="Zapasy" meaning="kopia zapasowa Twoich danych">
      <div className="stack">
        <p className="small">
          Wszystko (Spiżarnia, Receptura, czat) jest tylko na tym telefonie. Usunięcie apki z ekranu początkowego kasuje dane — rób kopię raz na jakiś czas.
        </p>
        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={exportData}>
            <Icon name="download" size={18} />
            Zrób kopię (JSON)
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} />
            Wczytaj kopię
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
        </div>
        {persisted !== null ? (
          <p className="small muted">{persisted ? 'Przeglądarka oznaczyła dane jako trwałe.' : 'Dane nie są oznaczone jako trwałe — tym bardziej rób kopie.'}</p>
        ) : null}
        <p className="small muted">C.H.L.E.B · wersja {__APP_VERSION__} · Etap 1</p>
      </div>
    </Section>
  );
}
