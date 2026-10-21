// Ocena ogłoszenia castingowego pod Twoje emploi — same słowa kluczowe, bez API (0 zł).
// Wynik: match (pasuje) · maybe (warto zerknąć) · reject (odrzucone) · scam (możliwe oszustwo).
import { normalize, anyMatch, firstMatch } from './text.js';
import * as E from './emploi.js';
import { parseAges, parseHeights, overlaps, findEmails, findPhones, extractFields } from './parse.js';

export const VERDICTS = {
  match: { label: 'Pasuje', hint: 'trafienie pod Twoje emploi' },
  maybe: { label: 'Warto zerknąć', hint: 'brakuje danych albo jest haczyk' },
  unsure: { label: 'Znak zapytania', hint: 'Chleb nie wie, czy to w ogóle ogłoszenie dla Ciebie' },
  reject: { label: 'Odrzucone', hint: 'nie pod Twoje emploi' },
  scam: { label: 'Możliwe oszustwo', hint: 'nie zgłaszaj się bez sprawdzenia' },
};

const KIND_ORDER = { danger: 0, minus: 1, warn: 2, plus: 3, info: 4 };

export function localToday(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

const fmtRange = ([a, b]) => (b >= 99 ? `${a}+` : a === b ? `${a}` : `${a}–${b}`);
const fmtAges = (ranges) => ranges.map(fmtRange).join(', ');

// Obcy język: cyrylica, litery spoza PL/EN albo za mało typowych słów polskich i angielskich.
export function isForeignLanguage(raw, n = normalize(raw)) {
  const letters = (raw.match(/\p{L}/gu) ?? []).length || 1;
  const words = n.match(/[a-z]+/g) ?? [];
  const known = words.filter((w) => E.PL_EN_WORDS.has(w)).length;
  const foreign = words.filter((w) => E.FOREIGN_WORDS.has(w)).length;
  // Cyrylica odpada, chyba że post ma też porządną część po polsku/angielsku.
  if ((raw.match(/[\u0400-\u04FF]/g) ?? []).length / letters > 0.3 && known < 5) return true;
  if ((raw.match(E.FOREIGN_LETTERS) ?? []).length >= 3) return true;
  return foreign >= 3 && foreign > known;
}

export function detectScam(raw) {
  const n = normalize(raw);
  const strong = E.SCAM_STRONG.filter(({ re }) => re.test(n)).map(({ label }) => label);
  const weak = E.SCAM_WEAK.filter(({ re }) => re.test(n)).map(({ label }) => label);

  const joinedDigits = n.replace(/(?<=\d)[\s.()-]+(?=\d)/g, '');
  if (E.SCAM_PHONES.some((num) => joinedDigits.includes(num))) strong.push('znany numer oszustów (782 033 833)');

  const foreign = findPhones(raw).filter((p) => /^(\+|00)/.test(p) && !/^(\+|00)\s*48/.test(p));
  if (foreign.length) weak.push(`zagraniczny numer telefonu (${foreign[0].trim().split(/[\s.-]/)[0]})`);

  const onlyMessenger = E.MESSENGER_ONLY.test(n) || (E.MESSENGER.test(n) && findEmails(raw).length === 0);
  if (onlyMessenger) strong.push('kontakt tylko przez komunikator (WhatsApp/Line/Telegram)');

  return { strong: [...new Set(strong)], weak: [...new Set(weak)] };
}

// Powiadomienia FB z grup: zostaw sam cytowany post, bez nagłówka i stopki Mety.
export function stripFbMail(text) {
  const m = text.match(/Witaj,[^!\n]*!\s*"([\s\S]*?)"\s*\n\s*={5,}/);
  return m ? m[1].trim() : text;
}

export function assessCasting({ subject = '', text = '', from = 'manual' } = {}, today = localToday()) {
  if (from.includes('facebookmail.com')) {
    if (E.FB_ADMIN.test(normalize(subject))) return { verdict: 'reject', reasons: [{ kind: 'minus', text: 'powiadomienie z Facebooka, nie ogłoszenie' }], fields: {}, meta: {} };
    text = stripFbMail(text);
    subject = ''; // temat to tylko „Grupa: początek posta…”
  }
  const raw = [subject, text].filter(Boolean).join('\n');
  const n = normalize(raw);
  const reasons = [];
  const add = (kind, label) => reasons.push({ kind, text: label });
  const fields = extractFields({ subject, text, from }, today);
  const lowInfo = from === 'manual' || E.LOW_INFO_SENDERS.some((s) => from.toLowerCase().includes(s));

  // „Warto zerknąć” tylko z czymś konkretnym na plus; reszta ląduje w Znakach zapytania.
  const finish = (verdict, meta = {}) => ({
    verdict: verdict === 'maybe' && (!reasons.some((r) => r.kind === 'plus') || !(E.SEEKING.test(n) || E.OFFER.test(n) || /\brol(a|e|i)\b/.test(n) || parseAges(raw).length)) ? 'unsure' : verdict,
    reasons: reasons.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]),
    fields,
    meta,
  });

  // 1) Oszustwa — przed wszystkim innym.
  const scam = detectScam(raw);
  if (scam.strong.length || scam.weak.length >= 2) {
    [...scam.strong, ...scam.weak].forEach((t) => add('danger', t));
    return finish('scam');
  }

  // 2) Cechy ogłoszenia.
  const female = anyMatch(E.FEMALE, n);
  const male = anyMatch(E.MALE, n);
  const gender = anyMatch(E.ANY_GENDER, n) || (female && male) ? 'any' : female ? 'female' : male ? 'male' : 'unknown';
  const ages = parseAges(raw);
  const fitting = ages.filter((r) => overlaps(r, E.PROFILE.playingAge));
  const maxAge = ages.length ? Math.max(...ages.map((r) => r[1])) : null;
  const child = anyMatch(E.CHILD, n);
  const extras = anyMatch(E.EXTRAS, n);
  const roleTier = firstMatch(E.ROLE_TIER, n)?.label ?? null;
  const extrasOnly = extras && !roleTier;
  const student = anyMatch(E.STUDENT_FILM, n);
  const big = E.BIG_PRODUCTION.filter(({ re }) => re.test(n)).map(({ label }) => label);
  const local = anyMatch(E.LOCAL, n);
  const otherCity = anyMatch(E.OTHER_CITY, n);
  const production = E.PRODUCTION.filter(({ re }) => re.test(n)).map(({ label }) => label);
  const acting = anyMatch(E.ACTING, n);
  const photo = anyMatch(E.PHOTO_SESSION, n);
  const modeling = anyMatch(E.MODELING, n);
  const blocked = firstMatch(E.BLOCKED_PLATFORMS, n);
  const meta = { gender, ages, production, roleTier, extras: extrasOnly };

  // 3) Twarde odrzucenia z Twojej listy.
  const rejects = [];
  if (blocked) rejects.push(`${blocked.label} — odrzucasz`);
  if (gender === 'male') rejects.push('rola męska');
  if (ages.length && !fitting.length) rejects.push(`wiek ${fmtAges(ages)} — poza Twoim zakresem 15–24`);
  if (child && (!ages.length || maxAge <= 16 || !fitting.length)) rejects.push('ogłoszenie dla dzieci');
  if (extrasOnly) {
    if (student) rejects.push('statysterka w filmie studenckim');
    else if (!big.length) rejects.push('statysterka poza dużą produkcją (TVP/Netflix/Canal+/HBO/Polsat)');
    else if (!local && otherCity) rejects.push('statysterka poza Śląskiem i Krakowem');
  }
  if ((photo || modeling) && !(production.length && acting)) rejects.push(photo ? 'sesja u fotografa' : 'modeling');
  // Dzieci podane liczbami (np. 6–10 lat) — nawet gdy obok pada słowo „młodzież”.
  if (child && ages.some(([, b]) => b <= 12) && gender !== 'female') rejects.push('ogłoszenie dla dzieci');
  // Twoja lista „NIE”: dojazdy do Warszawy/Łodzi/Gdańska tylko po konkretną rolę.
  const strongProduction = production.some((p) => p !== 'reklama');
  if (E.FAR_CITY.test(n) && !local && !roleTier && !strongProduction) rejects.push('Warszawa/Łódź/Gdańsk bez konkretnej roli — nie opłaca się dojazd');
  if (!roleTier) for (const { re, label } of E.OFF_EMPLOI) if (re.test(n)) rejects.push(label);
  if (E.QUESTION.test(n) && !E.OFFER.test(n)) rejects.push('pytanie/dyskusja, nie ogłoszenie');
  if (E.CREW.test(n) && !E.ACTOR_WORDS.test(n.replace(E.CREW, ''))) rejects.push('szukają ekipy (nie obsady)');
  if (!E.ACTOR_WORDS.test(n) && !E.SEEKING.test(n) && gender === 'unknown' && !ages.length) rejects.push('nie ogłoszenie castingowe (brak roli/obsady)');
  if (E.SELF_PROMO.test(n) && !E.OFFER.test(n) && !/\bszukam\w* (?:\w+ )?(?:aktor|osob|obsad|kobiet|dziewczyn|mezczyzn|chlopak)/.test(n)) rejects.push('autoprezentacja, nie ogłoszenie');
  if (isForeignLanguage(raw, n)) rejects.push('ogłoszenie w innym języku (nie PL/EN)');
  if (E.ONLY_OTHER_CITY.test(n)) rejects.push('tylko dla osób z innego miasta');
  if (E.OTHER_LOOK.test(n)) rejects.push('szukają innego typu urody');
  if (E.SERVICE.test(n) && !roleTier && !E.OFFER.test(n)) rejects.push('warsztat/usługa, nie casting');
  if (rejects.length) {
    [...new Set(rejects)].forEach((t) => add('minus', t));
    return finish('reject', meta);
  }

  // 4) Plusy, haczyki i niewiadome.
  if (gender === 'female') add('plus', 'rola kobieca');
  if (gender === 'any') add('plus', 'role dla kobiet i mężczyzn');
  if (fitting.length) add('plus', `wiek ${fmtAges(fitting)} — w Twoim zakresie`);
  if (roleTier) add('plus', roleTier);
  if (extrasOnly) add('info', `statysterka w dużej produkcji (${big.join(', ')})`);
  if (production.length) add('info', production.join(' · '));
  const skills = E.SKILLS.filter(({ re }) => re.test(n)).map(({ label }) => label);
  skills
    .filter((label) => !(label.startsWith('angielski') && skills.some((s) => s.startsWith('akcent RP'))))
    .forEach((label) => add('plus', label));
  const advancedRiding = E.ADVANCED_RIDING.test(n);
  if (advancedRiding) add('warn', 'wymagana zaawansowana jazda konna — Ty: podstawowa');
  if (local) add('plus', 'Kraków/Śląsk — blisko');
  if (E.INTERNATIONAL.test(n)) add('plus', 'produkcja międzynarodowa/UK');
  const heights = parseHeights(raw);
  const heightFit = heights.length ? heights.some(([a, b]) => a <= E.PROFILE.heightCm && E.PROFILE.heightCm <= b) : null;
  if (heightFit === true || (heightFit === null && E.SHORT_HINT.test(n))) add('plus', `wzrost pasuje (${E.PROFILE.heightCm} cm)`);
  if (heightFit === false) add('warn', `wymagany wzrost ${heights.map(([a, b]) => (a === 0 ? `do ${b}` : b >= 250 ? `od ${a}` : `${a}–${b}`)).join(', ')} cm — Ty: ${E.PROFILE.heightCm} cm`);
  if (extrasOnly && !local) add('warn', 'sprawdź miejsce zdjęć — statysterka tylko Śląsk/Kraków');
  if (photo || modeling) add('warn', 'w ogłoszeniu jest sesja zdjęciowa/modeling — sprawdź, czy chodzi o rolę');
  scam.weak.forEach((t) => add('warn', t));

  const looksLikeCasting = acting || production.length || roleTier || extras;
  if (!looksLikeCasting) {
    if (lowInfo) {
      add('info', 'mało treści — nie da się ocenić, zajrzyj sama');
      return finish('maybe', meta);
    }
    add('minus', 'nie wygląda na ogłoszenie castingowe');
    return finish('reject', meta);
  }

  const unknown = [];
  if (gender === 'unknown') unknown.push('płci');
  if (!ages.length) unknown.push('wieku');
  if (!production.length && !roleTier && !extrasOnly) unknown.push('typu roli');
  if (unknown.length) add('info', `brak informacji o: ${unknown.join(', ')}`);

  const hasCatch = scam.weak.length || heightFit === false || advancedRiding || photo || modeling || (extrasOnly && !local);
  return finish(unknown.length || hasCatch ? 'maybe' : 'match', meta);
}
