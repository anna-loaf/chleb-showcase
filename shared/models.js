// JEDNO miejsce z modelami i cennikiem.
// Używają go: serwer (server/chat.js — wybór modelu) i apka (src/lib/costs.js — licznik zł).
// Ceny: USD za 1 mln tokenów, platform.claude.com/docs/en/about-claude/pricing (stan: 2026-09).

export const MODELS = {
  // Główny model rozmów — start na Sonnet.
  main: {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    maxTokens: 2048,
    // Sonnet 5 domyślnie myśli adaptacyjnie; niski effort = krótsze myślenie = taniej.
    // Nie zmieniaj go w trakcie rozmowy — zmiana effort unieważnia cache rozmowy.
    params: { output_config: { effort: 'low' } },
  },
  // Tańszy model do prostych rozmów — gotowy, domyślnie wyłączony (Zaplecze → Tańszy model).
  light: {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    maxTokens: 1024,
    params: {}, // Haiku 4.5 nie przyjmuje parametru effort
  },
};

// Model do tanich zadań w tle (wydarzenia): czytanie repertuarów i wyszukiwarka.
export const EVENTS_MODEL = 'claude-haiku-5-5';

export const PRICES = {
  'claude-sonnet-5': { input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, cacheWrite5m: 0.125, cacheWrite1h: 0.2, cacheRead: 0.01, output: 0.5 },
  'claude-haiku-4-5': { input: 1, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, output: 5 },
};

export function priceFor(modelId = '') {
  const key = Object.keys(PRICES).find((k) => modelId.startsWith(k));
  return key ? PRICES[key] : null;
}
