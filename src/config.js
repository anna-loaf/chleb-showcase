// Ustawienia domyślne. Budżet, kurs i VAT zmienisz też w apce (Zaplecze).
export const BUDGET = {
  monthlyPln: 50,
  usdPln: 3.85, // kurs średni NBP ~3,84 zł (koniec września 2026); przy płatności kartą bywa wyższy
  vatPercent: 23, // Anthropic dolicza VAT osobom prywatnym w UE
  warnAt: 0.8, // ostrzeżenie w czacie przy 80% budżetu
};

// Do API idzie najwyżej `windowMax` ostatnich wiadomości. Po przekroczeniu okno skacze
// do `windowKeep` — skokowo, a nie co wiadomość, żeby cache promptu dalej działał.
export const CHAT = { windowMax: 24, windowKeep: 12 };

export const TASKS_PER_DAY = 3;
export const WELCOME_ONCE_PER_DAY = true;
