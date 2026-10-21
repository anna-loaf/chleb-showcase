import { useState } from 'react';
import { PROGRESSED, STATUS, STATUSES } from '../lib/statuses.js';
import { monthKey } from '../lib/dates.js';

const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

function Tile({ label, value, note }) {
  return (
    <div className="tile">
      <p className="tile-label">{label}</p>
      <p className="tile-value">{value}</p>
      <p className="tile-note">{note}</p>
    </div>
  );
}

// Kafelki + pasek podziału statusów. Legenda z liczbami = widok tabelaryczny,
// więc kolor nigdy nie jest jedynym nośnikiem informacji.
export function Stats({ castings }) {
  const [active, setActive] = useState(null);
  const total = castings.length;
  const month = monthKey();
  const thisMonth = castings.filter((c) => (c.appliedAt ?? '').startsWith(month)).length;
  const progressed = castings.filter((c) => PROGRESSED.has(c.status) || (c.statusHistory ?? []).some((h) => PROGRESSED.has(h.status))).length;
  const won = castings.filter((c) => c.status === 'upieczone').length;
  const counts = STATUSES.map((s) => ({ ...s, n: castings.filter((c) => c.status === s.id).length }));
  const pct = (n) => Math.round((n / total) * 100);
  const activeCount = active ? counts.find((c) => c.id === active).n : 0;

  return (
    <>
      <div className="tiles">
        <Tile label="Zgłoszenia" value={total} note="łącznie" />
        <Tile label="W tym miesiącu" value={thisMonth} note={MONTHS[Number(month.slice(5)) - 1]} />
        <Tile label="Dalej niż zaczyn" value={progressed} note={total ? `${pct(progressed)}% zgłoszeń` : 'self-tape lub dalszy etap'} />
        <Tile label="Upieczone" value={won} note="zdobyte role" />
      </div>
      {total > 0 ? (
        <>
          <div className="stackbar" role="group" aria-label="Podział zgłoszeń według statusu">
            {counts
              .filter((c) => c.n)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  style={{ flex: c.n, background: c.color }}
                  aria-label={`${c.name} — ${c.meaning}: ${c.n}`}
                  onClick={() => setActive(active === c.id ? null : c.id)}
                />
              ))}
          </div>
          <p className="stackbar-readout" aria-live="polite">
            {active ? `${STATUS[active].name} — ${STATUS[active].meaning}: ${activeCount} (${pct(activeCount)}%)` : 'Tapnij pasek, żeby zobaczyć udział.'}
          </p>
          <ul className="legend">
            {counts.map((c) => (
              <li key={c.id}>
                <span className="dot" style={{ background: c.color }} aria-hidden="true" />
                <span>
                  {c.name} <span className="muted small">— {c.meaning}</span>
                </span>
                <span className="count">{c.n}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
