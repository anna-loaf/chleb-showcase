// Pop-up powitalny: pochwała za konkret z wczoraj albo motywacja/ciekawostka.
import { FACTS, MOTIVATIONS } from './content/greetings.js';
import { addDays, dayOfIso, daysBetween } from './dates.js';
import { clip } from '../../shared/text.js';

const PRIORITY = ['upieczone', 'w_piecu', 'wyrasta', 'zaczyn', 'nastepny'];

export function plural(n, [one, few, many]) {
  if (n === 1) return one;
  const d = n % 10;
  const dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
}

const EVENT_MESSAGES = {
  upieczone: (t) => ({ title: 'Upieczone!', body: `Wczoraj „${t}” — rola jest Twoja. To efekt roboty, nie przypadku. Zapisz w notatkach, co zadziałało, zanim zapomnisz.` }),
  w_piecu: (t) => ({ title: 'Jesteś w piecu!', body: `„${t}” przeszło wczoraj do dalszego etapu. Teraz przygotuj się konkretnie: przeczytaj scenę jeszcze raz i nazwij, czego chce Twoja postać.` }),
  wyrasta: (t) => ({ title: 'Wyrasta!', body: `Wczoraj ruszył self-tape do „${t}”. Pilnuj terminu i nagraj wersję, z której będziesz dumna — nie idealną.` }),
  zaczyn: (t) => ({ title: 'Super! Wczorajsze zgłoszenie jest za Tobą!', body: `„${t}” poszło w świat. Zrobione jest lepsze niż idealne — zaczyn nastawiony, teraz niech rośnie.` }),
  nastepny: (t) => ({ title: 'Następny wypiek', body: `„${t}” tym razem nie wyszło. To jedna blacha, nie cały piec — zanotuj, czego się nauczyłaś, i wyślij kolejne zgłoszenie.` }),
};

export function buildWelcome({ today, castings = [], tasks = [] }) {
  const yesterday = addDays(today, -1);
  const events = [];
  for (const c of castings) {
    for (const h of c.statusHistory ?? []) if (dayOfIso(h.at) === yesterday) events.push({ status: h.status, title: clip(c.title, 60) });
  }
  const done = tasks.filter((t) => t.date === yesterday && t.done);

  if (events.length) {
    events.sort((a, b) => PRIORITY.indexOf(a.status) - PRIORITY.indexOf(b.status));
    const more = events.length - 1 + done.length;
    const msg = EVENT_MESSAGES[events[0].status](events[0].title);
    return { kind: 'praise', ...msg, extra: more > 0 ? `…i jeszcze ${more} ${plural(more, ['ruch', 'ruchy', 'ruchów'])} z wczoraj.` : '' };
  }
  if (done.length) {
    const more = done.length - 1;
    return {
      kind: 'praise',
      title: 'Super, wczoraj był konkret!',
      body: `Odhaczone: „${clip(done[0].text, 70)}”${more ? ` i jeszcze ${more} ${plural(more, ['składnik', 'składniki', 'składników'])}` : ''}. Tak się buduje formę — kawałek po kawałku.`,
      extra: '',
    };
  }
  const n = daysBetween('2026-01-01', today);
  const pick = (list) => list[((Math.floor(n / 2) % list.length) + list.length) % list.length];
  return n % 2 === 0
    ? { kind: 'motivation', title: 'Dzień dobry z pieca', body: pick(MOTIVATIONS), extra: '' }
    : { kind: 'fact', title: 'Ciekawostka z branży', body: pick(FACTS), extra: '' };
}
