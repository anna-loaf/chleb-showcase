// Normalizacja tekstu pod dopasowania: małe litery, bez polskich znaków (ą→a, ł→l…),
// jednolite myślniki. Dla polskiego tekstu długość się nie zmienia, więc indeksy pasują do oryginału.
export function normalize(input) {
  return String(input ?? '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‐-―−]/g, '-')
    .replace(/ /g, ' ');
}

export function clip(text, max) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export function anyMatch(patterns, text) {
  return patterns.some((re) => re.test(text));
}

export function firstMatch(entries, text) {
  return entries.find(({ re }) => re.test(text)) ?? null;
}
