import { useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { STATUS } from '../lib/statuses.js';
import { VERDICTS } from '../../shared/filter.js';

// Sekcja z chlebową nazwą i ZAWSZE widocznym, jasnym podtytułem.
export function Section({ name, meaning, action, children, id }) {
  return (
    <section className="card" aria-labelledby={id}>
      <div className="section-head">
        <div>
          <h2 className="section-title" id={id}>
            {name}
          </h2>
          <p className="section-sub">{meaning}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// Arkusz od dołu ekranu (modal). Esc i tapnięcie w tło zamykają.
export function Sheet({ title, meaning, onClose, children, labelId = 'sheet-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement;
    ref.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelId} tabIndex={-1} ref={ref}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <div>
            <h2 className="section-title" id={labelId}>
              {title}
            </h2>
            {meaning ? <p className="section-sub">{meaning}</p> : null}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Zamknij">
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatusLabel({ id }) {
  const s = STATUS[id] ?? STATUS.zaczyn;
  return (
    <>
      <span className="dot" style={{ background: s.color }} aria-hidden="true" />
      <span>
        <span className="status-name">{s.name}</span> <span className="status-meaning">— {s.meaning}</span>
      </span>
    </>
  );
}

export function VerdictBadge({ verdict }) {
  const v = VERDICTS[verdict] ?? VERDICTS.maybe;
  return (
    <span className={`verdict verdict-${verdict}`}>
      {verdict === 'scam' ? <Icon name="alert" size={15} /> : null}
      {v.label}
      <span className="visually-hidden"> — {v.hint}</span>
    </span>
  );
}

const MARKS = { plus: '+', minus: '−', warn: '!', info: '·', danger: '!' };

export function Reasons({ reasons, limit }) {
  const list = limit ? reasons.slice(0, limit) : reasons;
  if (!list.length) return null;
  return (
    <ul className="reasons">
      {list.map((r, i) => (
        <li key={i} className={`reason-${r.kind}`}>
          <span className="mark" aria-hidden="true">
            {MARKS[r.kind]}
          </span>
          <span>{r.text}</span>
        </li>
      ))}
    </ul>
  );
}
