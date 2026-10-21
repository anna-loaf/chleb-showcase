// Daty jako klucze 'YYYY-MM-DD' w czasie lokalnym telefonu.
const pad = (n) => String(n).padStart(2, '0');

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (key, n) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};
export const daysBetween = (from, to) => Math.round((parseKey(to) - parseKey(from)) / 86_400_000);
export const dayOfIso = (iso) => dayKey(new Date(iso));

const MONTHS_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

export const fmtShort = (key) => {
  const d = parseKey(key);
  return `${d.getDate()}.${pad(d.getMonth() + 1)}`;
};
export const fmtLong = (key) => {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
};
export const fmtWeekday = (key) => WEEKDAYS[parseKey(key).getDay()];

export function relDays(key, today = dayKey()) {
  const n = daysBetween(today, key);
  if (n === 0) return 'dziś';
  if (n === 1) return 'jutro';
  if (n === -1) return 'wczoraj';
  return n > 1 ? `za ${n} dni` : `${-n} dni temu`;
}
