// Spiżarnia — historia castingów i statystyki. Status zmieniasz tapnięciem.
import { useState } from 'react';
import { useLive } from '../db/useLive.js';
import { deleteCasting, listCastings, saveCasting, setStatus } from '../data/castings.js';
import { STATUS, STATUSES } from '../lib/statuses.js';
import { dayKey, fmtShort } from '../lib/dates.js';
import { clip } from '../../shared/text.js';
import { Section, Sheet, StatusLabel } from '../components/ui.jsx';
import { Stats } from '../components/Stats.jsx';
import { Icon } from '../components/Icon.jsx';
import { useToast } from '../components/Toast.jsx';

export function History() {
  const castings = useLive(listCastings, ['castings']);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [statusFor, setStatusFor] = useState(null);
  const list = (castings ?? []).filter((c) => filter === 'all' || c.status === filter);

  return (
    <>
      <Section id="stats" name="Bilans wypieków" meaning="statystyki Twoich zgłoszeń">
        <Stats castings={castings ?? []} />
      </Section>

      <Section
        id="history"
        name="Historia wypieków"
        meaning="wszystkie zgłoszenia — tapnij status, żeby go zmienić"
        action={
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditing({})}>
            <Icon name="plus" size={18} />
            Dodaj
          </button>
        }
      >
        <div className="filters" role="group" aria-label="Pokaż status">
          <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            Wszystkie ({castings?.length ?? 0})
          </button>
          {STATUSES.map((s) => (
            <button key={s.id} type="button" className="chip" aria-pressed={filter === s.id} onClick={() => setFilter(s.id)}>
              <span className="dot" style={{ background: s.color }} aria-hidden="true" />
              {s.name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          {castings && !list.length ? (
            <p className="empty">
              {castings.length ? 'Nic w tym statusie.' : 'Jeszcze pusto. Tapnij „Zgłosiłam się” przy castingu na Piecu albo dodaj zgłoszenie ręcznie.'}
            </p>
          ) : null}
          {list.map((c) => (
            <article key={c.id} className="casting">
              <div className="casting-top">
                <button type="button" className="casting-title" onClick={() => setEditing(c)}>
                  {c.title}
                </button>
                <button type="button" className="task-swap" aria-label={`Edytuj „${c.title}”`} onClick={() => setEditing(c)}>
                  <Icon name="pencil" size={18} />
                </button>
              </div>
              <p className="casting-meta">{[c.source, c.appliedAt ? `zgłoszone ${fmtShort(c.appliedAt)}` : null, c.contact].filter(Boolean).join(' · ')}</p>
              <div>
                <button
                  type="button"
                  className="status-button"
                  onClick={() => setStatusFor(c)}
                  aria-label={`Status: ${(STATUS[c.status] ?? STATUS.zaczyn).name} — ${(STATUS[c.status] ?? STATUS.zaczyn).meaning}. Tapnij, żeby zmienić.`}
                >
                  <StatusLabel id={c.status} />
                  <Icon name="chevron" size={16} />
                </button>
              </div>
              {c.notes ? <p className="small muted">{clip(c.notes, 160)}</p> : null}
            </article>
          ))}
        </div>
      </Section>

      {statusFor ? <StatusSheet casting={statusFor} onClose={() => setStatusFor(null)} /> : null}
      {editing ? <CastingSheet casting={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function StatusSheet({ casting, onClose }) {
  const toast = useToast();
  const pick = async (id) => {
    if (id !== casting.status) {
      await setStatus(casting.id, id);
      toast(`„${clip(casting.title, 36)}” → ${STATUS[id].name} (${STATUS[id].meaning})`);
    }
    onClose();
  };
  return (
    <Sheet title="Zmień status" meaning={casting.title} onClose={onClose} labelId="status-title">
      <div className="status-options">
        {STATUSES.map((s) => (
          <button key={s.id} type="button" className="status-option" aria-pressed={casting.status === s.id} onClick={() => pick(s.id)}>
            <span className="dot" style={{ background: s.color, width: 14, height: 14 }} aria-hidden="true" />
            <span>
              <span className="status-name">{s.name}</span>
              <br />
              <span className="status-meaning">{s.meaning}</span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

const EMPTY = { title: '', source: '', appliedAt: '', status: 'zaczyn', contact: '', link: '', deadline: '', notes: '' };

function CastingSheet({ casting, onClose }) {
  const isNew = !casting.id;
  const [form, setForm] = useState(() => ({ ...EMPTY, appliedAt: dayKey(), ...casting, deadline: casting.deadline ?? '' }));
  const toast = useToast();
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    await saveCasting({ ...form, title: form.title.trim(), deadline: form.deadline || null });
    toast(isNew ? 'Dodane do Spiżarni.' : 'Zapisane.');
    onClose();
  };
  const remove = async () => {
    if (!window.confirm(`Usunąć „${form.title}” ze Spiżarni? Tego nie da się cofnąć.`)) return;
    await deleteCasting(casting.id);
    toast('Usunięte ze Spiżarni.');
    onClose();
  };

  return (
    <Sheet title={isNew ? 'Nowe zgłoszenie' : 'Edytuj zgłoszenie'} meaning="pola historii castingu" onClose={onClose} labelId="casting-title">
      <form className="stack" onSubmit={save}>
        <div className="field">
          <label htmlFor="c-title">Projekt / rola</label>
          <input id="c-title" className="input" required value={form.title} onChange={set('title')} placeholder="np. Serial „Wiatr” — rola Zosi" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="c-source">Źródło</label>
            <input id="c-source" className="input" value={form.source} onChange={set('source')} placeholder="EasyCasting" />
          </div>
          <div className="field">
            <label htmlFor="c-applied">Data zgłoszenia</label>
            <input id="c-applied" type="date" className="input" value={form.appliedAt} onChange={set('appliedAt')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-status">Status</label>
          <select id="c-status" className="select" value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.meaning}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="c-contact">Reżyser castingu / kontakt</label>
          <input id="c-contact" className="input" value={form.contact} onChange={set('contact')} placeholder="imię i nazwisko, mail, telefon" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="c-deadline">Deadline</label>
            <input id="c-deadline" type="date" className="input" value={form.deadline} onChange={set('deadline')} />
          </div>
          <div className="field">
            <label htmlFor="c-link">Link</label>
            <input id="c-link" type="url" inputMode="url" className="input" value={form.link} onChange={set('link')} placeholder="https://…" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-notes">Notatki</label>
          <textarea id="c-notes" className="textarea" rows={3} value={form.notes} onChange={set('notes')} placeholder="Co wysłałaś, jak poszło, czego się nauczyłaś" />
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          {isNew ? 'Dodaj do Spiżarni' : 'Zapisz'}
        </button>
        {!isNew ? (
          <button type="button" className="btn btn-danger btn-block" onClick={remove}>
            <Icon name="trash" size={18} />
            Usuń zgłoszenie
          </button>
        ) : null}
      </form>
    </Sheet>
  );
}
