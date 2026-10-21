// Co się piecze — wydarzenia (public/events.json, skan w poniedziałek) + Twoje ulubione.
import { useEffect, useState } from 'react';
import { useLive } from '../db/useLive.js';
import { getSettings, setSetting } from '../data/settings.js';
import { Section } from '../components/ui.jsx';
import { Icon } from '../components/Icon.jsx';
import { useToast } from '../components/Toast.jsx';

export const REGION_TABS = [
  ['krakow', 'Kraków'],
  ['slask', 'Śląsk'],
  ['inne', 'Inne (Polska)'],
];
const CAT_LABEL = { spektakl: 'spektakl', impro: 'impro', standup: 'stand-up', koncert: 'koncert', warsztat: 'warsztaty', festiwal: 'festiwal', spotkanie: 'spotkanie z twórcami', branza: 'okazja branżowa' };
const fmtWhen = (iso) => new Date(iso).toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtPrice = (p) => (p === 0 ? 'za darmo' : p == null ? 'cena: sprawdź' : `${Math.round(p)} zł`);
export const eventId = (e) => `${e.title}|${e.start}`;
// Starsze listy miały region „warszawa” — dziś to część „Inne”.
const regionOf = (e) => (e.region === 'warszawa' ? 'inne' : e.region);

// Link otwierający Kalendarz Google z wypełnionym wydarzeniem (Ty tylko tapiesz „Zapisz”).
export function googleCalendarUrl(e) {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const startAt = new Date(e.start);
  const endAt = new Date(startAt.getTime() + 2 * 3_600_000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${fmt(startAt)}/${fmt(endAt)}`,
    location: [e.venue, e.city].filter(Boolean).join(', '),
    details: [e.url, 'Z Chleba 🍞'].filter(Boolean).join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function useEvents() {
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chleb-events') ?? 'null');
    } catch {
      return null;
    }
  });
  useEffect(() => {
    fetch('/events.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.events) return;
        setData(d);
        try {
          localStorage.setItem('chleb-events', JSON.stringify(d)); // offline: ostatnia lista zostaje
        } catch {}
      })
      .catch(() => {});
  }, []);
  return data;
}

// Ulubione trzymamy w całości (nie tylko id), żeby nie znikały po cotygodniowej aktualizacji listy.
function useFavorites() {
  const settings = useLive(getSettings, ['settings']);
  const favs = settings?.favEvents ?? {};
  const toggle = (e) => {
    const next = { ...favs };
    if (next[eventId(e)]) delete next[eventId(e)];
    else next[eventId(e)] = e;
    return setSetting('favEvents', next);
  };
  return [favs, toggle];
}

function EventCard({ e, fav, onFav }) {
  return (
    <article className="fresh-item">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className={`verdict ${e.price === 0 ? 'verdict-match' : 'verdict-maybe'}`}>{fmtPrice(e.price)}</span>
        <span className="row" style={{ gap: 6 }}>
          <span className="deadline">
            <Icon name="calendar" size={15} />
            {fmtWhen(e.start)}
          </span>
          <button type="button" className="task-swap" aria-pressed={fav} aria-label={fav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'} onClick={onFav}>
            <span aria-hidden="true" style={{ fontSize: 20, color: fav ? 'var(--caramel)' : 'var(--ink-2)' }}>
              {fav ? '★' : '☆'}
            </span>
          </button>
        </span>
      </div>
      <h3 className="fresh-title">{e.title}</h3>
      <p className="casting-meta">{[CAT_LABEL[e.category], e.venue, e.city].filter(Boolean).join(' · ')}</p>
      <p className="small muted">
        źródło: {e.source || '—'}
        {e.viaSearch ? ' · z wyszukiwarki — sprawdź u organizatora' : ''}
      </p>
      <div className="row">
        {e.url ? (
          <a className="small" href={e.url} target="_blank" rel="noopener noreferrer">
            Szczegóły i bilety ↗
          </a>
        ) : null}
        {fav ? (
          <a className="btn btn-secondary btn-small" href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer">
            <Icon name="calendar" size={16} />
            Dodaj do Kalendarza Google
          </a>
        ) : null}
      </div>
    </article>
  );
}

function useEventList(region) {
  const data = useEvents();
  const [favs, toggle] = useFavorites();
  const soon = (e) => Date.parse(e.start) > Date.now() - 3 * 3_600_000;
  const pinned = Object.values(favs).filter((e) => soon(e) && regionOf(e) === region).sort((a, b) => a.start.localeCompare(b.start));
  const rest = (data?.events ?? []).filter((e) => soon(e) && regionOf(e) === region && !favs[eventId(e)]);
  const count = (r) => (data?.events ?? []).filter((e) => soon(e) && regionOf(e) === r).length;
  return { data, favs, toggle, list: [...pinned, ...rest], count };
}

function RegionChips({ region, setRegion, count }) {
  return (
    <div className="filters" role="group" aria-label="Region">
      {REGION_TABS.map(([id, label]) => (
        <button key={id} type="button" className="chip" aria-pressed={region === id} onClick={() => setRegion(id)}>
          {label} ({count(id)})
        </button>
      ))}
    </div>
  );
}

function EmptyState({ data, region, list }) {
  if (!data) return <p className="empty">Lista wydarzeń pojawi się po pierwszym poniedziałkowym skanie.</p>;
  if (!list.length) return <p className="empty">{region === 'inne' ? 'W tych tygodniach nic ważnego w reszcie Polski.' : 'Na razie pusto w tym regionie.'}</p>;
  return null;
}

// Pełna zakładka „Wydarzenia”.
export function Events() {
  const [region, setRegion] = useState('krakow');
  const { data, favs, toggle, list, count } = useEventList(region);
  const toast = useToast();
  const onFav = async (e) => {
    const was = Boolean(favs[eventId(e)]);
    await toggle(e);
    toast(was ? 'Usunięte z ulubionych.' : 'W ulubionych ★ — przypięte na górze. Możesz dodać je do kalendarza.');
  };
  return (
    <Section id="events" name="Co się piecze" meaning="wydarzenia na 2 tygodnie — ★ ulubione na górze, potem darmowe i tanie">
      <RegionChips region={region} setRegion={setRegion} count={count} />
      <EmptyState data={data} region={region} list={list} />
      <div className="stack" style={{ marginTop: 10 }}>
        {list.map((e) => (
          <EventCard key={eventId(e)} e={e} fav={Boolean(favs[eventId(e)])} onFav={() => onFav(e)} />
        ))}
      </div>
      {data?.generatedAt ? (
        <p className="small muted" style={{ marginTop: 8 }}>
          Zaktualizowano: {new Date(data.generatedAt).toLocaleDateString('pl-PL')}
        </p>
      ) : null}
    </Section>
  );
}

// Skrót na Piecu: kilka pozycji + „Więcej”.
export function EventsPreview() {
  const [region, setRegion] = useState('krakow');
  const { data, favs, toggle, list, count } = useEventList(region);
  return (
    <Section id="events-preview" name="Co się piecze" meaning="wydarzenia — skrót, pełna lista w zakładce" action={<a className="icon-button" href="#/wydarzenia" aria-label="Wszystkie wydarzenia"><Icon name="chevron" size={20} /></a>}>
      <RegionChips region={region} setRegion={setRegion} count={count} />
      <EmptyState data={data} region={region} list={list} />
      <div className="stack" style={{ marginTop: 10 }}>
        {list.slice(0, 3).map((e) => (
          <EventCard key={eventId(e)} e={e} fav={Boolean(favs[eventId(e)])} onFav={() => toggle(e)} />
        ))}
      </div>
      {list.length > 3 ? (
        <a className="btn btn-ghost btn-block" href="#/wydarzenia">
          Więcej wydarzeń ({list.length}) →
        </a>
      ) : null}
    </Section>
  );
}
