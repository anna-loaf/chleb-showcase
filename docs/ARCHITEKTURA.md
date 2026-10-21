# C.H.L.E.B — architektura

Prywatny agent aktorski jako PWA na iPhone'a (iOS 26+, dodawana do ekranu początkowego).
Dane są na urządzeniu, a jedyny serwer to cienkie proxy, które ukrywa klucz API.

## Hosting: Vercel (nie GitHub Pages)

| | GitHub Pages | **Vercel Hobby** |
|---|---|---|
| Strona statyczna (PWA) | ✅ | ✅ |
| Funkcja serwerowa `/api/chat` | ❌ (brak) | ✅ darmowa |
| Gdzie trzymać klucz Anthropic | w kodzie JS strony = **publiczny**, każdy może go użyć | w zmiennych środowiskowych funkcji, nigdy w przeglądarce |
| Koszt | 0 zł | 0 zł (plan Hobby: użytek prywatny, niekomercyjny) |

GitHub Pages odpada, bo klucz trafiłby do publicznego pliku JS i każdy mógłby wydać Twój budżet.
Vercel hostuje apkę i mini-funkcję `/api/chat`, która trzyma klucz. Do tego dochodzi hasło dostępu,
więc obcy nie skorzystają z Twojego proxy.

## Schemat

```
 iPhone (PWA, offline-first)                         Vercel (darmowy)                 Anthropic
┌───────────────────────────────┐   HTTPS + hasło   ┌──────────────────────┐        ┌────────────┐
│ React + Vite                  │ ───────────────▶ │ /api/chat            │ ─────▶ │ Claude API │
│ IndexedDB: castingi, zadania, │ ◀─ strumień ──── │ (jedyne miejsce z    │ ◀───── │ Sonnet 5   │
│ czat, Receptura, zużycie      │                  │  kluczem API)        │        │ (Haiku 4.5)│
│ Service worker: cache, push   │                  └──────────────────────┘        └────────────┘
└───────────────▲───────────────┘
                │ web-push (Etap 2)
┌───────────────┴───────────────┐
│ GitHub Actions — cron 3×/dzień│  IMAP: dedykowana skrzynka castingowa (hasło aplikacji)
│ skan maila → filtr → push     │  filtr = ten sam moduł shared/filter.js co w apce (0 zł)
└───────────────────────────────┘
```

## Struktura projektu

```
chleb/
├── api/chat.js            # endpoint Vercel → server/chat.js
├── server/
│   ├── chat.js            # JEDYNE wywołanie Claude API: walidacja, hasło, strumień, błędy
│   └── mockChat.js        # tryb próbny w dev (gdy brak klucza) — nic nie kosztuje
├── shared/                # logika wspólna: przeglądarka + Node (GitHub Actions w Etapie 2)
│   ├── models.js          # modele i cennik (Sonnet teraz, Haiku przygotowany)
│   ├── emploi.js          # Twoje emploi + reguły filtra (słowa kluczowe, wzorce oszustw)
│   ├── parse.js           # tytuł, deadline, kontakt, wiek, wzrost z tekstu ogłoszenia
│   ├── filter.js          # werdykt: pasuje / warto zerknąć / odrzuć / oszustwo
│   └── text.js            # normalizacja polskich znaków
├── src/
│   ├── sw.js              # service worker (precache offline; push w Etapie 2)
│   ├── config.js          # budżet, kurs, okno historii czatu
│   ├── db/db.js           # IndexedDB (idb) + odświeżanie widoków
│   ├── data/              # operacje na danych (castingi, zadania, czat, ustawienia)
│   ├── lib/               # czysta logika: prompt, koszty, pop-up, zadania, daty…
│   ├── components/        # karty, arkusze, ikony, pasek zakładek
│   ├── views/             # Piec, Czat, Spiżarnia, Receptura, Zaplecze
│   └── styles/            # paleta „Zioła na chlebie”
├── test/                  # testy filtra, parsera, kosztów, zadań, pop-upu (node --test)
├── scripts/make-icons.mjs # bochenek SVG → ikony PNG
└── docs/                  # ta architektura
```

## Dane (IndexedDB, tylko na telefonie)

| Magazyn | Zawartość |
|---|---|
| `castings` | historia: projekt/rola, źródło, data zgłoszenia, status, reżyser castingu/kontakt, notatki, link, deadline, historia statusów |
| `inbox` | „Świeże z pieca”: ogłoszenia z werdyktem filtra, czekające na decyzję |
| `tasks` | „Składniki na dziś” (z odhaczeniami — pop-up chwali za nie następnego dnia) |
| `chat` | rozmowa z Chlebem |
| `settings` | Receptura (baza wiedzy o Tobie), hasło dostępu, budżet, przełączniki |
| `usage` | zużycie tokenów i koszt w danym miesiącu |

Kopię zapasową (JSON) zrobisz w Zapleczu. Po usunięciu apki z ekranu początkowego iOS kasuje jej dane.

## Czat: koszt pod kontrolą

- **Jedno miejsce wywołania API**: `server/chat.js` (serwer) i `src/lib/ai.js` (apka).
  Model wybiera się po „poziomie” (`main` / `light`) zdefiniowanym w `shared/models.js`.
- Start: **Claude Sonnet 5** ($2 / $10 za 1 mln tokenów wejścia/wyjścia), `effort: low`.
- Przygotowane: **Haiku 4.5** dla prostych pytań (przełącznik w Zapleczu, domyślnie wyłączony).
- Cache promptu: osobowość i Receptura są stałe (cache'owane), a kontekst dnia idzie
  w wiadomości. Rozmowa jest przycinana skokowo, żeby cache działał.
- Trzy bezpieczniki: (1) twardy limit w konsoli Anthropic, (2) licznik zł w apce z blokadą
  po przekroczeniu budżetu, (3) limity rozmiaru zapytań na serwerze.

## Etapy

1. **Etap 1 (teraz)**: Piec (dashboard), pop-up powitalny, czat, Receptura, Spiżarnia
   z przyciskiem „Zgłosiłam się”, ręczne wklejanie ogłoszeń z filtrem słów kluczowych.
2. **Etap 2**: GitHub Actions (cron: rano/południe/wieczór) → IMAP dedykowanej skrzynki →
   `shared/filter.js` → web-push tylko z trafieniami → service worker zapisuje je w „Świeżych z pieca”.
3. **Etap 3**: wydarzenia (Kraków pełny zakres, Śląsk pełny zakres, Warszawa tylko rangi
   ogólnopolskiej), najpierw darmowe i tanie. Osobny moduł ze świeżymi danymi z sieci.
