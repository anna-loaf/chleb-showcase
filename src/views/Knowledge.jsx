// Receptura — baza wiedzy o Tobie. Chleb dostaje ją przy każdej rozmowie.
import { useEffect, useState } from 'react';
import { useLive } from '../db/useLive.js';
import { getSettings, setSetting } from '../data/settings.js';
import { KNOWLEDGE_FIELDS } from '../lib/prompt.js';
import { Section } from '../components/ui.jsx';

export function Knowledge() {
  const settings = useLive(getSettings, ['settings']);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (settings && !draft) setDraft(settings.knowledge);
  }, [settings, draft]);

  useEffect(() => {
    if (!draft || !settings || JSON.stringify(draft) === JSON.stringify(settings.knowledge)) return;
    setNote('');
    const t = setTimeout(async () => {
      await setSetting('knowledge', draft);
      setNote('Zapisane — Chleb użyje tego od następnej wiadomości.');
    }, 700);
    return () => clearTimeout(t);
  }, [draft, settings]);

  if (!draft) return null;
  return (
    <Section id="recipe" name="Twoja receptura" meaning="im konkretniej, tym celniejsze rady Chleba — zapisuje się samo">
      <div className="stack">
        {KNOWLEDGE_FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`k-${f.key}`}>{f.label}</label>
            {f.rows === 1 ? (
              <input id={`k-${f.key}`} className="input" value={draft[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            ) : (
              <textarea
                id={`k-${f.key}`}
                className="textarea"
                rows={f.rows}
                value={draft[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
        <p className="saved-note" aria-live="polite">
          {note}
        </p>
        <p className="small muted">
          Receptura zostaje na telefonie. Do Claude API trafia tylko w treści rozmowy — gdy piszesz z Chlebem.
        </p>
      </div>
    </Section>
  );
}
