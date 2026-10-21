// Etap 3: wydarzenia. Co zbieramy, skąd i jak filtrujemy — tu zmieniasz zasady.
export const HORIZON_DAYS = 14; // skan w poniedziałek → zapas na 2 tygodnie

export const REGIONS = {
  krakow: { label: 'Kraków', full: true },
  slask: { label: 'Śląsk', full: true },
  inne: { label: 'Inne (Polska)', full: false }, // tylko ważne: festiwale itp. — nacisk na Warszawę, też Łódź, Wrocław…
};

// Miasto (po normalize) → region.
export const CITY_REGION = [
  { re: /\bkrakow|\bwieliczk|\bnowa huta/, region: 'krakow' },
  { re: /\bkatowic|\bgliwic|\bzabrz|\bchorzow|\bbytom|\bsosnowi?e?c|\btychy|\bruda slask|\brybnik|\bsiemianowic|\bmikolow|\bdabrow\w* gornicz|\bjaworzn|\bpiekary|\bswietochlowic|\bzory|\bjastrzeb|\bbielsk|\bczestochow|\bslask/, region: 'slask' },
  { re: /\bwarszaw|\blodz|\bwroclaw|\bgdansk|\bgdyni|\bsopot|\bpoznan|\btorun|\bbydgoszcz|\blublin|\bszczecin|\bbialystok|\brzeszow|\bopol|\bkielc|\bolsztyn/, region: 'inne' },
];

export const CATEGORIES = {
  spektakl: 'spektakl',
  impro: 'impro',
  standup: 'stand-up',
  koncert: 'koncert',
  warsztat: 'warsztaty',
  festiwal: 'festiwal',
  spotkanie: 'spotkanie z twórcami',
  branza: 'okazja branżowa',
  premiera: 'premiera filmowa',
};

// Kolejność ma znaczenie — pierwsze trafienie wygrywa.
export const CATEGORY_RULES = [
  { re: /\bwarsztat\w*|\bworkshop\w*|\bmasterclass\w*|\bkurs\w*|\bzajeci\w* (aktorsk|wokaln|taneczn)/, cat: 'warsztat' },
  { re: /\bspotkani\w* (z|autorsk)|\brozmow\w* z (aktor|rezyser)|\bq&a\b|\bmeet\w* the\b/, cat: 'spotkanie' },
  { re: /\bcasting\w* na zywo|\bprzesluchani\w*|\bdni? otwart\w*|\bprzeglad\w* (teatr|aktor|monolog)|\bnabor\w*/, cat: 'branza' },
  { re: /\bimpro\w*|\bimprowizac\w*/, cat: 'impro' },
  { re: /\bstand[- ]?up\w*|\bkabaret\w*/, cat: 'standup' },
  { re: /\bfestiwal\w*|\bfestival\w*/, cat: 'festiwal' },
  { re: /\bspektakl\w*|\bteatr\w*|\bmonodram\w*|\bmusical\w*|\bopera\b|\bbalet\w*/, cat: 'spektakl' },
  { re: /\bkoncert\w*|\brecital\w*|\bjazz\w*|\bfilharmoni\w*/, cat: 'koncert' },
];
export const SCHEMA_TYPE_CAT = { TheaterEvent: 'spektakl', ComedyEvent: 'standup', MusicEvent: 'koncert', Festival: 'festiwal', EducationEvent: 'warsztat' };

// Pomijamy (Twoja lista): wystawy, dla dzieci, kluby/dyskoteki, sport.
export const EXCLUDE_TYPES = new Set(['ExhibitionEvent', 'ChildrensEvent', 'SportsEvent', 'Exhibition']);
export const EXCLUDE = /\bdla dzieci\b|\bdzieci\w* w wieku\b|\bbajk\w*|\bwystaw\w*|\bdyskotek\w*|\bdisco\b|\bimpreza klubowa\b|\bmecz\w*|\bturniej\w*|\bmaraton\w*|\btargi\b/;

// Darmowe źródła z danymi w formacie schema.org/Event (bez scrapera, 0 zł).
export const SCHEMA_SOURCES = [
  { url: 'https://kulturalnie.slask.pl/', name: 'kulturalnie.slask.pl' },
  { url: 'https://www.biletyna.pl/Katowice', name: 'biletyna.pl' },
  { url: 'https://www.biletyna.pl/Krakow', name: 'biletyna.pl' },
];

// Warstwa Claude (Haiku 5.5): repertuary teatrów + wyszukiwarka. Koszt ok. $0,08 za tygodniowy skan.
// Gdy false, skan bierze tylko darmowe portale (0 zł).
export const WEB_SEARCH_ENABLED = process.env.CHLEB_EVENTS_AI !== '0'; // włączone (decyzja 2026-10-12); CHLEB_EVENTS_AI=0 wyłącza
// Twardy sufit liczby wyszukiwań w jednym skanie.
export const WEB_SEARCH_MAX_USES = 8;

// Repertuary teatrów: program pobiera stronę i zamienia ją na tekst, Haiku tylko wyciąga daty
// (bez żadnych narzędzi — nie przegląda internetu). Strony bez odpowiedzi (np. Słowacki) łapie wyszukiwarka.
export const THEATRES = [
  { name: 'Narodowy Stary Teatr', url: 'https://stary.pl/pl/repertuar', city: 'Kraków' },
  { name: 'Teatr Ludowy', url: 'https://ludowy.pl/repertuar', city: 'Kraków' },
  { name: 'Teatr KTO', url: 'https://teatrkto.pl/repertuar', city: 'Kraków' },
  { name: 'Scena STU', url: 'https://bilety.scenastu.pl/', city: 'Kraków', textLimit: 120_000 },
  { name: 'Teatr Śląski', url: 'https://teatrslaski.art.pl/repertuar', city: 'Katowice' },
];
// Variété: repertuar w danych strony (Next.js) — czytany wprost, bez Haiku (0 zł).
export const VARIETE_URL = 'https://www.teatrvariete.pl/repertuar/sprawdz-repertuar';
// Te strony ładują repertuar skryptem albo blokują automaty — szuka ich wyszukiwarka.
export const SEARCH_THEATRES = ['Teatr im. Juliusza Słowackiego w Krakowie', 'Łaźnia Nowa', 'Teatr Bagatela'];

// Premiery polskich filmów (PISF) — cała Polska, region „Inne”.
export const PREMIERES = { name: 'PISF — premiery', url: 'https://pisf.pl/premiery-2026-2/' };
export const PAGE_TEXT_LIMIT = 60_000; // znaków tekstu na stronę (koszt i czytelność)
