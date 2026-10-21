# C.H.L.E.B — prywatny agent aktorski 🍞

Aplikacja na iPhone'a (PWA), którą zaprojektowałam dla siebie jako aktorki. Agent ma na imię **Chleb**. Codziennie szuka dla mnie castingów, ocenia, czy pasują do mojego emploi, pilnuje terminów, podpowiada wydarzenia branżowe i rozmawia ze mną jak agent. Wszystko to mieści się w budżecie **poniżej 50 zł miesięcznie**.

> To publiczna kopia demonstracyjna. Profil aktorki w Recepturze jest **fikcyjny**, a prawdziwe dane, klucze i historia zmian zostają w prywatnym repozytorium.

## Problem

Ogłoszenia castingowe są rozproszone po mailach, platformach i kilkunastu grupach na Facebooku. Większość z nich nie pasuje: inny wiek, rola męska, statystowanie w innym mieście albo zwykłe oszustwo („wpisowe”, kontakt tylko przez WhatsApp). Przeglądanie tego ręcznie zajmuje godziny.

## Co robi Chleb

- **Skan 3× dziennie** (GitHub Actions): dedykowana skrzynka castingowa (IMAP) i grupy na Facebooku (Apify). Powiadomienie push przychodzi **tylko z trafieniami**.
- **Filtr emploi bez AI**: deterministyczne reguły oceniają wiek, płeć, miasto, typ produkcji i język ogłoszenia. Rozpoznają też ekipę zamiast obsady, autoprezentacje i wzorce oszustw. Każde ogłoszenie dostaje werdykt z uzasadnieniem: *pasuje / warto zerknąć / znak zapytania / odrzucone / możliwe oszustwo*.
- **Znaki zapytania**: ogłoszenia, których filtr nie jest pewien, trafiają do osobnej zakładki z cichym powiadomieniem, żeby nie robić szumu.
- **Wydarzenia** (raz w tygodniu): repertuary teatrów, portale z danymi schema.org, premiery PISF i wyszukiwanie wspierane przez Claude Haiku. Ulubione można przypiąć i dodać do Kalendarza Google.
- **Czat z agentem** (Claude Sonnet): zna profil aktorki (Recepturę), historię zgłoszeń i zadania na dziś.
- **Spiżarnia**: historia castingów ze statusami i statystykami.
- **Offline-first**: dane leżą tylko w telefonie (IndexedDB). Bez internetu działa wszystko poza czatem.

## Architektura

```
iPhone (PWA, React + Vite)          Vercel (serverless)           Anthropic API
IndexedDB, service worker  ──────▶  /api/chat — JEDYNE miejsce ──▶ Claude Sonnet / Haiku
        ▲  web-push                 wywołania modelu, hasło dostępu
        │
GitHub Actions (cron)
  scan.yml   3×/dzień: Gmail (IMAP) + Facebook (Apify) → filtr → push
  events.yml 1×/tydz.: teatry, portale, PISF, wyszukiwarka (Haiku) → public/events.json
```

Szczegóły: [docs/ARCHITEKTURA.md](docs/ARCHITEKTURA.md).

## Decyzje projektowe, z których jestem dumna

- **Bezpieczeństwo danych**
  - Żadnych sekretów w repo: klucze leżą w `.env`, sekretach GitHuba i zmiennych Vercela.
  - Skaner czyta wyłącznie dedykowaną skrzynkę castingową, nigdy prywatną.
- **Ochrona przed prompt injection**
  - Wyszukiwanie wydarzeń działa w izolacji: model nie dostaje żadnych danych użytkowniczki.
  - Wynik jest walidowany schematem.
  - Wydarzenie „za darmo” musi mieć cytat potwierdzony w treści strony.
- **Koszty pod kontrolą**
  - Filtr działa bez AI, więc zero kosztów na ogłoszenie.
  - Prompt caching w czacie.
  - Do zadań w tle używam taniego modelu Haiku.
  - Twardy limit wydatków w konsoli.
  - Realny koszt to kilka złotych miesięcznie.
- **Jedno miejsce wywołania modelu** (`server/chat.js`): łatwo zmienić model, limity i logowanie kosztów.
- **Testy**: 67 testów (`node --test`) na filtrze, parserach, serwerze i wydarzeniach. Wiele z nich powstało z prawdziwych pomyłek filtra, np. obcych języków, wieku w nawiasie czy powiadomień z Facebooka.
- **Iteracje na danych**: po tygodniu działania przeanalizowałam wszystkie zeskanowane ogłoszenia. Szum w „warto zerknąć” spadł z 36 do 7 pozycji.

## Stos

React 19 · Vite 8 · vite-plugin-pwa (Workbox) · IndexedDB (`idb`) · Vercel Functions · Anthropic SDK (streaming, prompt caching, web search) · GitHub Actions · imapflow · Apify · Web Push (VAPID)

## Uruchomienie

```bash
npm install
cp .env.example .env      # klucze opcjonalne
npm run dev               # http://localhost:5173
npm test
```

Bez klucza API czat działa w **trybie próbnym**: odpowiada szablonem i nic nie kosztuje.

## Gdzie co jest

| Co | Plik |
|---|---|
| reguły filtra (emploi, oszustwa, języki) | `shared/emploi.js`, `shared/filter.js` |
| skaner maili i Facebooka | `scripts/scan-mail.mjs`, `scripts/fb.mjs` |
| wydarzenia | `scripts/events.mjs`, `shared/events-config.js` |
| czat i prompt agenta | `server/chat.js`, `src/lib/prompt.js` |
| modele i cennik | `shared/models.js` |
