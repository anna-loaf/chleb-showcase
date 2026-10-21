// „Wklej ogłoszenie” — ocena filtrem słów kluczowych (0 zł) i dodanie do Świeżych z pieca.
import { useMemo, useState } from 'react';
import { assessCasting, VERDICTS } from '../../shared/filter.js';
import { addInboxItem } from '../data/castings.js';
import { dayKey } from '../lib/dates.js';
import { go } from '../lib/router.js';
import { Reasons, Sheet, VerdictBadge } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icon.jsx';

const SOURCES = ['EasyCasting', 'Spotlight', 'Facebook (grupa)', 'Szkoła / znajomi', 'Inne'];

export const askAboutDraft = (item) =>
  `Oceń to ogłoszenie: czy pasuje do mnie, czy to nie oszustwo i co konkretnie zrobić?\n\n${item.title}\n${(item.text ?? '').slice(0, 3000)}`;

export function PasteSheet({ onClose }) {
  const [text, setText] = useState('');
  const [source, setSource] = useState(SOURCES[0]);
  const [title, setTitle] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const toast = useToast();
  const today = dayKey();

  const assessment = useMemo(
    () => (text.trim().length >= 20 ? assessCasting({ text, from: source === 'Facebook (grupa)' ? 'groupupdates@facebookmail.com' : 'manual' }, today) : null),
    [text, source, today],
  );
  const risky = assessment && (assessment.verdict === 'scam' || assessment.verdict === 'reject');
  const finalTitle = title ?? assessment?.fields.title ?? '';
  const finalDeadline = deadline ?? assessment?.fields.deadline ?? '';

  const save = async () => {
    await addInboxItem({ assessment, text: text.trim(), source, title: finalTitle, deadline: finalDeadline || null });
    toast('Dodane do Świeżych z pieca.');
    onClose();
  };

  return (
    <Sheet title="Wklej ogłoszenie" meaning="Chleb oceni je pod Twoje emploi — bez kosztów API" onClose={onClose} labelId="paste-title">
      <div className="stack">
        <div className="field">
          <label htmlFor="paste-source">Skąd to ogłoszenie?</label>
          <select id="paste-source" className="select" value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="paste-text">Treść</label>
          <textarea
            id="paste-text"
            className="textarea"
            rows={7}
            value={text}
            placeholder="Wklej całe ogłoszenie albo treść maila…"
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {assessment ? (
          <div className="stack" aria-live="polite">
            <div className="row">
              <VerdictBadge verdict={assessment.verdict} />
              <span className="small muted">{VERDICTS[assessment.verdict].hint}</span>
            </div>
            <Reasons reasons={assessment.reasons} />
            <div className="field">
              <label htmlFor="paste-title-input">Projekt / rola</label>
              <input id="paste-title-input" className="input" value={finalTitle} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="paste-deadline">Deadline</label>
              <input id="paste-deadline" type="date" className="input" value={finalDeadline} onChange={(e) => setDeadline(e.target.value)} />
              <span className="hint">{assessment.fields.deadline ? 'Wykryty w treści — popraw, jeśli trzeba.' : 'Nie znalazłem terminu w treści.'}</span>
            </div>
            <button type="button" className={`btn btn-block ${risky ? 'btn-secondary' : 'btn-primary'}`} onClick={save} disabled={!finalTitle.trim()}>
              {risky ? 'Dodaj mimo to' : 'Dodaj do Świeżych z pieca'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                go('czat', { draft: askAboutDraft({ title: finalTitle, text }) });
                onClose();
              }}
            >
              <Icon name="chat" size={18} />
              Zapytaj Chleba o to ogłoszenie
            </button>
          </div>
        ) : (
          <p className="small muted">Wklej min. kilka zdań — ocena pojawi się od razu.</p>
        )}
      </div>
    </Sheet>
  );
}
