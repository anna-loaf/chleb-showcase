// Wyciąganie danych z treści ogłoszenia/maila: tytuł, deadline, kontakt, link, wiek, wzrost.
// Czysty JS — działa w przeglądarce i w Node (skan maila w Etapie 2).
import { normalize, clip } from './text.js';
import { SOURCES } from './emploi.js';

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// ── Wiek ────────────────────────────────────────────────────────────────
const RANGE = String.raw`(?<!\d)(\d{1,2})\s*(?:-|do|to)\s*(\d{1,2})(?!\d)`;
const AGE_UNIT = String.raw`\s*-?\s*(?:lat\w*|l\.|yo\b|y\.?o\.?|years?|yrs?|roku zycia)`;
const WHO = String.raw`(?:kobiet\w*|dziewczyn\w*|mezczyz\w*|chlopak\w*|chlop(?:iec|ca|cy)|aktork\w*|aktora|osob\w*|statys\w*|dzieci|dziecko|mlodziez\w*|females?|males?|wom[ae]n|m[ae]n|girls?|boys?|actress\w*)`;

const AGE_RANGE_PATTERNS = [
  new RegExp(RANGE + AGE_UNIT, 'g'),
  new RegExp(String.raw`(?:wiek\w*|w wieku|playing age|age range|aged|age)\s*(?:sceniczn\w*\s*)?:?\s*(?:od\s*)?` + RANGE, 'g'),
  new RegExp(WHO + String.raw`[^\d\n]{0,20}?` + RANGE + String.raw`(?!\s*(?:cm|zl|pln|eur|%|\.\d|:\d|[./]\d))`, 'g'),
];
const AGE_WORDS = [
  { re: /\bnastolat\w*|\bteen\w*|\bmlodziez\w*/g, range: [13, 19] },
  { re: /\bdwudziestolat\w*|\btwenties\b/g, range: [20, 24] },
  { re: /\btrzydziestolat\w*|\bthirties\b/g, range: [30, 34] },
  { re: /\bczterdziestolat\w*|\bforties\b/g, range: [40, 44] },
  { re: /\bpiecdziesieciolat\w*/g, range: [50, 54] },
  { re: /\bpo trzydziestce\b|\bpo 30\b/g, range: [30, 45] },
  { re: /\bpo czterdziestce\b|\bpo 40\b/g, range: [40, 55] },
  { re: /\bpelnoletni\w*/g, range: [18, 99] },
];

export function parseAges(text) {
  const n = normalize(text);
  const found = [];
  const spans = [];
  const push = (a, b, index, length) => {
    if (!(a >= 1 && b <= 99 && a <= b && (b - a <= 60 || b === 99))) return;
    spans.push([index, index + length]);
    if (!found.some(([x, y]) => x === a && y === b)) found.push([a, b]);
  };
  for (const re of AGE_RANGE_PATTERNS) {
    for (const m of n.matchAll(re)) push(Number(m[1]), Number(m[2]), m.index, m[0].length);
  }
  const insideSpan = (i) => spans.some(([s, e]) => i >= s && i < e);
  // „18+”
  for (const m of n.matchAll(/(?<![\d-])(\d{2})\s*\+/g)) {
    const a = Number(m[1]);
    if (a >= 13 && a <= 80 && !insideSpan(m.index)) push(a, 99, m.index, m[0].length);
  }
  // „Hanna (83)”, „Artur Wrona (45)” — wiek postaci w nawiasie
  for (const m of n.matchAll(/[a-z*]\s*\((\d{2})\s*(?:l\.|lat)?\)/g)) {
    const a = Number(m[1]);
    if (a >= 10 && a <= 95 && !insideSpan(m.index)) push(Math.max(1, a - 3), a + 3, m.index, m[0].length);
  }
  // „20-latka”, „30-latkę”
  for (const m of n.matchAll(/(?<![\d-])(\d{2})\s*-?\s*latk\w*/g)) {
    if (!insideSpan(m.index)) push(Number(m[1]), Number(m[1]) + 4, m.index, m[0].length);
  }
  // „kobieta, 45 lat”, „około 30 lat”
  for (const m of n.matchAll(/(kobiet\w*|dziewczyn\w*|mezczyz\w*|chlopak\w*|aktork\w*|postac\w*|wiek\w*|w wieku|okolo|ok\.)[^\d\n]{0,12}(?<!\d)(\d{1,2})\s*(?:lat|l\.|years? old|yo)\b(?!\s*(?:doswiadcz|stazu|pracy|temu))/g)) {
    const idx = m.index + m[0].indexOf(m[2]);
    if (insideSpan(idx)) continue;
    const a = Number(m[2]);
    if (/^(okolo|ok\.)$/.test(m[1])) push(Math.max(1, a - 3), a + 3, idx, m[2].length);
    else push(a, a, idx, m[2].length);
  }
  // „in her early 20s”, „late 20s”
  for (const m of n.matchAll(/\b(early|mid|late)?[- ]?([1-7])0s\b/g)) {
    const base = Number(m[2]) * 10;
    const [lo, hi] = m[1] === 'early' ? [0, 3] : m[1] === 'mid' ? [3, 6] : m[1] === 'late' ? [6, 9] : [0, 9];
    push(base + lo, base + hi, m.index, m[0].length);
  }
  for (const { re, range } of AGE_WORDS) {
    for (const m of n.matchAll(re)) if (!insideSpan(m.index)) push(range[0], range[1], m.index, m[0].length);
  }
  return found;
}

export const overlaps = ([a, b], [c, d]) => a <= d && c <= b;

// ── Wzrost ──────────────────────────────────────────────────────────────
export function parseHeights(text) {
  const n = normalize(text);
  const out = [];
  for (const m of n.matchAll(/(?<!\d)(\d{3})\s*-\s*(\d{3})\s*cm/g)) out.push([+m[1], +m[2]]);
  for (const m of n.matchAll(/\b(?:do|max\.?|maks\.?|maksymalnie|ponizej|up to|under)\s*(\d{3})\s*cm/g)) out.push([0, +m[1]]);
  for (const m of n.matchAll(/\b(?:od|min\.?|minimum|powyzej|over|at least)\s*(\d{3})\s*cm/g)) out.push([+m[1], 250]);
  for (const m of n.matchAll(/\bwzrost\w*\s*:?\s*(?:ok\.?|okolo)?\s*(\d{3})\s*cm/g)) out.push([+m[1] - 4, +m[1] + 4]);
  return out.filter(([a, b]) => a <= b && b <= 250);
}

// ── Daty i deadline ─────────────────────────────────────────────────────
const MONTHS = {
  sty: 1, jan: 1, lut: 2, feb: 2, mar: 3, kwi: 4, apr: 4, maj: 5, may: 5, cze: 6, jun: 6,
  lip: 7, jul: 7, sie: 8, aug: 8, wrz: 9, sep: 9, paz: 10, oct: 10, lis: 11, nov: 11, gru: 12, dec: 12,
};
const MONTH_WORD = String.raw`(stycz\w*|lut\w*|marc\w*|marz\w*|kwie\w*|maj\w*|czerw\w*|lip\w*|sierp\w*|wrzes\w*|pazdz\w*|listop\w*|grud\w*|january|february|march|april|may|june?|july?|august|sept?(?:ember)?|october|november|december|jan|feb|mar|apr|aug|oct|nov|dec)\b\.?`;
const DATE_PATTERNS = [
  { re: /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g, pick: (m) => [+m[1], +m[2], +m[3]] },
  { re: /(?<![\d.])(\d{1,2})[./](\d{1,2})(?:[./](\d{4}|\d{2}))?(?![\d])/g, pick: (m) => [m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : null, +m[2], +m[1]] },
  { re: new RegExp(String.raw`(?<!\d)(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?` + MONTH_WORD + String.raw`(?:\s+(\d{4}))?`, 'g'), pick: (m) => [m[3] ? +m[3] : null, MONTHS[m[2].slice(0, 3)], +m[1]] },
  { re: new RegExp(MONTH_WORD + String.raw`\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?(?!\d)`, 'g'), pick: (m) => [m[3] ? +m[3] : null, MONTHS[m[1].slice(0, 3)], +m[2]] },
];
const DEADLINE_HINT = /(deadline|termin(?!\w*\s+(?:zdjec|nagran|realizacj|planu))\w*|zgloszen\w*|zglos\w*|aplik\w*|nadsyla\w*|przesyla\w*|wysyla\w*|czekamy|najpozniej|do dnia|apply|applications?|submission\w*|submit\w*|self[- ]?tapes?|closing|until|due)\b[^.\n]{0,45}$/;
const DIRECT_DO = /(?:^|[^a-z])(do|do dnia|until|by)\s*$/;

function resolveYear(year, month, day, today) {
  if (!month || month > 12 || !day || day > 31) return null;
  if (year) return isoDate(year, month, day);
  const [ty, tm, td] = today.split('-').map(Number);
  const candidate = isoDate(ty, month, day);
  const daysAgo = (Date.UTC(ty, tm - 1, td) - Date.UTC(ty, month - 1, day)) / 86_400_000;
  return daysAgo > 60 ? isoDate(ty + 1, month, day) : candidate;
}

function validIso(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? iso : null;
}

export function findDates(text, today) {
  const n = normalize(text);
  const dates = [];
  for (const { re, pick } of DATE_PATTERNS) {
    for (const m of n.matchAll(re)) {
      const [y, mo, d] = pick(m);
      const iso = validIso(resolveYear(y, mo, d, today));
      if (iso && !dates.some((x) => x.index === m.index)) dates.push({ iso, index: m.index, end: m.index + m[0].length });
    }
  }
  return dates.sort((a, b) => a.index - b.index);
}

export function findDeadline(text, today) {
  const n = normalize(text);
  const dates = findDates(text, today);
  const lineBefore = (i) => n.slice(Math.max(0, i - 60), i).split('\n').pop();
  const hinted = dates.find((d) => DEADLINE_HINT.test(lineBefore(d.index)));
  if (hinted) return hinted.iso;
  const direct = dates.find((d) => {
    const before = lineBefore(d.index);
    return DIRECT_DO.test(before) && !/\bod\s*\d{1,2}[./]\d{1,2}\S*\s*do\s*$/.test(before);
  });
  return direct?.iso ?? null;
}

// ── Kontakt, link, reżyser castingu ─────────────────────────────────────
const IGNORED_EMAILS = new RegExp(`^(${Object.keys(SOURCES).map((s) => s.replace(/[.]/g, '\\.')).join('|')})$|no-?reply|notification`, 'i');

export function findEmails(text) {
  const all = String(text ?? '').match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
  return [...new Set(all.map((e) => e.toLowerCase()))].filter((e) => !IGNORED_EMAILS.test(e));
}

export function findPhones(text) {
  const all = String(text ?? '').match(/(?:\+|\b00)\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}|(?<![\d+])\d{3}[\s-]?\d{3}[\s-]?\d{3}(?![\d])/g) ?? [];
  return [...new Set(all.map((p) => p.trim()))];
}

export const digitsOf = (s) => String(s).replace(/\D/g, '');

export function findLinks(text) {
  const all = String(text ?? '').match(/https?:\/\/[^\s<>()"']+/gi) ?? [];
  return [...new Set(all.map((u) => u.replace(/[.,;:!?)\]]+$/, '')))];
}

const DIRECTOR_RE = /(rezyser\w*\s+castingu|casting director|kierownik\w*\s+castingu|castingi?\s+prowadzi|castingowiec\w*|casting by)\s*:?\s*/;

export function findCastingDirector(text) {
  for (const line of String(text ?? '').split('\n')) {
    const m = normalize(line).match(DIRECTOR_RE);
    if (m) {
      const rest = line.slice(m.index + m[0].length).replace(/^[\s:–-]+/, '').trim();
      if (rest) return clip(rest, 60);
    }
  }
  return '';
}

// ── Tytuł ───────────────────────────────────────────────────────────────
export function findTitle({ subject = '', text = '' }) {
  const cleaned = String(subject).replace(/^\s*((re|fwd?|fw|odp|pd)\s*:\s*)+/i, '').trim();
  if (cleaned) return clip(cleaned, 90);
  const line = String(text).split('\n').map((l) => l.trim()).find((l) => l.length > 3);
  if (!line) return 'Ogłoszenie castingowe';
  // Długa pierwsza linia (tekst wklejony bez akapitów) → pierwsze zdanie.
  const sentence = line.split(/(?<=[.!?])\s+/)[0].replace(/\.$/, '');
  return clip(line.length > 70 && sentence.length >= 12 ? sentence : line, 90);
}

export function sourceLabel(from = '') {
  const key = Object.keys(SOURCES).find((s) => from.toLowerCase().includes(s));
  return key ? SOURCES[key] : '';
}

// Wszystko naraz — do wypełnienia karty „Świeże z pieca” i historii jednym tapnięciem.
export function extractFields({ subject = '', text = '', from = '' }, today) {
  const full = [subject, text].filter(Boolean).join('\n');
  const emails = findEmails(full);
  const phones = findPhones(full);
  return {
    title: findTitle({ subject, text }),
    deadline: findDeadline(full, today),
    castingDirector: findCastingDirector(full),
    contact: emails[0] ?? phones[0] ?? '',
    link: findLinks(full)[0] ?? '',
    source: sourceLabel(from),
  };
}
