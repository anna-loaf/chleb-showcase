// Role — pełna lista „Świeżych z pieca” + wejście do Znaków zapytania.
import { useLive } from '../db/useLive.js';
import { listInbox } from '../data/castings.js';
import { dayKey } from '../lib/dates.js';
import { FreshSection } from './Dashboard.jsx';

export function Roles() {
  const inbox = useLive(listInbox, ['inbox']);
  const unsure = (inbox ?? []).filter((i) => i.state === 'new' && i.verdict === 'unsure').length;
  return (
    <>
      <FreshSection inbox={inbox} today={dayKey()} />
      <a className="btn btn-ghost btn-block" href="#/znaki">
        Znaki zapytania{unsure ? ` (${unsure})` : ''} →
      </a>
    </>
  );
}

// Znaki zapytania — ogłoszenia, których Chleb nie jest pewien. Bez powiadomień z dźwiękiem.
export function Unsure() {
  const inbox = useLive(listInbox, ['inbox']);
  return <FreshSection inbox={inbox} today={dayKey()} unsure />;
}
