// Publiczne grupy FB skanowane 3× dziennie (bez logowania — tylko publiczne).
// perMonth = ok. postów miesięcznie (z pomiaru / wyszukiwarki) — z tego liczony jest limit na skan.
export const FB_GROUPS = [
  { url: 'https://www.facebook.com/groups/479748013379818/', name: 'AKTORZY poszukiwani!', perMonth: 200 },
  { url: 'https://www.facebook.com/groups/172426936281052/', name: 'Castingi - ogłoszenia Artystyczne !', perMonth: 150 },
  { url: 'https://www.facebook.com/groups/803881082986624/', name: 'Statyści i Aktorzy', perMonth: 200 },
  { url: 'https://www.facebook.com/groups/184277054929526/', name: 'AKTORZY', perMonth: 130 },
  { url: 'https://www.facebook.com/groups/412138878882936/', name: 'Aktorzy Kraków', perMonth: 88 },
  // dodane 2026-10-11 (z wyszukiwania, zatwierdzone):
  { url: 'https://www.facebook.com/groups/castingkrakow/', name: 'Kraków, woj. Małopolskie - castingi, reklamy, filmy, seriale', perMonth: 48 },
  { url: 'https://www.facebook.com/groups/869112640690062/', name: 'Kraków. Statyści, epizodyści, aktorzy.', perMonth: 34 },
  { url: 'https://www.facebook.com/groups/castingkatowice/', name: 'Śląsk - castingi film reklama seriale', perMonth: 32 },
  { url: 'https://www.facebook.com/groups/1102258973134321/', name: 'CASTINGMANIA', perMonth: 49 },
  { url: 'https://www.facebook.com/groups/192083625250297/', name: 'Casting Reklama Filmy', perMonth: 264 },
  { url: 'https://www.facebook.com/groups/571454881362779/', name: 'Dubbing pl', perMonth: 37 },
  { url: 'https://www.facebook.com/groups/311762984835360/', name: 'Dema aktorskie | Castingi polska', perMonth: 12 },
  // UK — na razie odpuszczone (decyzja 2026-10-11)
];

// Scraper: AnyAPI na Apify (~$0,90 / 1000 postów, 1 grupa = 1 zapytanie). Wybrany 2026-10-11:
// Dami's Studio blokowany przez FB, Fanndev gubił ~80% postów, oficjalny za drogi.
export const FB_ACTOR = 'getanyapi~facebook-group-posts-scraper';
// Skany (UTC) z .github/workflows/scan.yml. Przerwa przed skanem: 05→12 h (noc), 10→5 h, 17→7 h.
export const SCAN_HOURS_UTC = [5, 10, 17];
export function gapBefore(hourUtc) {
  const prev = [...SCAN_HOURS_UTC].reverse().find((h) => h < hourUtc) ?? SCAN_HOURS_UTC.at(-1) - 24;
  return Math.min(12, Math.max(4, hourUtc - prev));
}

// Limit postów na grupę na skan: posty z (przerwa + 1 h) × 2 — zapas na wysyp ogłoszeń; min. 3.
export const postsPerScan = (g, gapHours = 12) => Math.max(3, Math.ceil((g.perMonth / 30) * ((gapHours + 1) / 24) * 2));
