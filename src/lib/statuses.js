// Statusy castingów: chlebowa nazwa + jasne znaczenie (zawsze wyświetlane razem).
// Kolory to tylko kropki i paski wykresu (tekst zawsze w kolorze tekstu) — sprawdzone
// walidatorem palety pod kątem daltonizmu na tle kart #fdf9f0.
export const STATUSES = [
  { id: 'zaczyn', name: 'Zaczyn', meaning: 'zgłoszona', color: '#e0a21e' },
  { id: 'wyrasta', name: 'Wyrasta', meaning: 'self-tape', color: '#cf5f2a' },
  { id: 'w_piecu', name: 'W piecu', meaning: 'II etap / dalszy etap', color: '#7a4b9e' },
  { id: 'upieczone', name: 'Upieczone!', meaning: 'dostałam rolę', color: '#4a8a2c' },
  { id: 'nastepny', name: 'Następny wypiek', meaning: 'nie tym razem (odrzucone)', color: '#3a78c0' },
];

export const STATUS = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

// Czy casting przeszedł dalej niż samo zgłoszenie (do statystyk).
export const PROGRESSED = new Set(['wyrasta', 'w_piecu', 'upieczone']);
