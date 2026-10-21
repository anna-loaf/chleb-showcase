// Twoje emploi i reguły filtra — tu dopisujesz/zmieniasz słowa kluczowe.
// Wszystkie wzorce działają na tekście po normalize(): małe litery, bez polskich znaków
// (np. „Śląsk” → „slask”, „mężczyzna” → „mezczyzna”).

export const PROFILE = {
  playingAge: [15, 24],
  heightCm: 165,
};

// Nadawcy maili castingowych (Etap 2). Facebook bywa ubogi w treść → nie odrzucamy w ciemno.
export const SOURCES = {
  'easycasting@easycasting.pl': 'EasyCasting',
  'link@spotlight.com': 'Spotlight',
  'groupupdates@facebookmail.com': 'Facebook (grupa)',
};
export const LOW_INFO_SENDERS = ['facebookmail.com'];

// ── Płeć ────────────────────────────────────────────────────────────────
export const FEMALE = [
  /\bkobiet\w*/, /\bdziewczyn(?!k)\w*/, /\baktork\w*/, /\bpani\b/, /\bcork[aieo]\w*/,
  /\bsiostr\w*/, /\bmatk[aiue]\b/, /\bmama\b/, /\bzon(a|y|ie)\b/, /\bstudentk\w*/,
  /\bbohaterk\w*/, /\bfemales?\b/, /\bwom[ae]n\b/, /\bgirls?\b/, /\bactress(es)?\b/,
  /\blad(y|ies)\b/,
];
export const MALE = [
  /\bmezczyz\w*/, /\bchlopak\w*/, /\bchlop(iec|ca|cy|cow)\b/, /\bmesk(a|ie|iej|ich|i)\b/,
  /\baktora\b/, /\bpan(a)? w wieku\b/, /\bmales?\b/, /\bm[ae]n\b/, /\bboys?\b/, /\bguys?\b/,
  /\bgentlem[ae]n\b/,
];
export const ANY_GENDER = [
  /\bk\s*\/\s*m\b/, /\bm\s*\/\s*k\b/, /\bobojga plci\b/, /\bbez wzgledu na plec\b/,
  /\b(wszystkich|kazdej|dowolnej) plci\b/, /\ball genders\b/, /\bany gender\b/,
];

// ── Dzieci ──────────────────────────────────────────────────────────────
export const CHILD = [
  /\bdla dzieci\b/, /\bdzieci w wieku\b/, /\bdziecko w wieku\b/, /\bdziewczynk\w*/,
  /\bchlop(iec|ca|cy|cow)\b/, /\bniemowl\w*/, /\bmaluch\w*/, /\bkids?\b/, /\bchild(ren)?\b/,
  /\bcasting\w* dzieci\w*/,
];

// ── Typ produkcji i roli ────────────────────────────────────────────────
export const PRODUCTION = [
  { re: /\bserial\w*|\btv (series|show|drama)\b|\bseries\b/, label: 'serial' },
  { re: /\bteatr\w*|\bspektakl\w*|\bprzedstawieni\w*|\btheat(re|er)\b/, label: 'teatr' },
  { re: /\bdubbing\w*|\bvoice[- ]?over\b|\bvoice actor\w*|\bnagrani\w* glos\w*/, label: 'dubbing' },
  { re: /\breklam\w*|\bspot\w*\b|\bcommercial\w*/, label: 'reklama' },
  { re: /\betiud\w*|\bfilm\w*|\bfeature\b|\bshort film\b|\bmovie\b/, label: 'film' },
];
export const ROLE_TIER = [
  { re: /\brol\w* glown\w*|\bglown\w* rol\w*|\bpierwszoplanow\w*|\blead(ing)? role\b|\bmain role\b|\bthe lead\b/, label: 'rola główna' },
  { re: /\bdrugoplanow\w*|\bdrugiego planu\b|\bsupporting\b/, label: 'rola drugoplanowa' },
  { re: /\bepizod\w*|\bfeatured\b/, label: 'rola epizodyczna' },
];
export const ACTING = [
  /\bcasting\w*/, /\bkasting\w*/, /\bprzesluchani\w*/, /\bself[- ]?tape\w*/, /\baudition\w*/,
  /\bobsad\w*/, /\brol(a|e|i|ach|ami)?\b/, /\baktork\w*/, /\bactress\w*/, /\broles?\b/,
];

// ── Statysterka ─────────────────────────────────────────────────────────
export const EXTRAS = [
  /\bstatys(?!tyk|tycz)\w*/, /\bfigurant\w*/, /\btlum(ie|u|y)?\b/, /\bscen\w* zbiorow\w*/,
  /\bbackground (actors?|artists?)\b/, /\bextras\b/, /\bas an extra\b/,
];
export const STUDENT_FILM = [
  /\betiud\w*/, /\bfilm\w* studenck\w*/, /\bprojekt\w* studenck\w*/, /\bstudenck\w* (film|projekt|produkcj)\w*/,
  /\bszkol\w* filmow\w*/, /\bfilmowk\w*/, /\bpwsftvit\b/, /\bwajda school\b/, /\bszkol\w* wajdy\b/,
  /\b(film|etiud|prac)\w* dyplomow\w*/, /\bwydzial\w* radia i telewizji\b/,
  /\bstudent (film|project)\b/, /\bgraduation film\b/, /\bfilm school\b/,
];
// Duże produkcje, w których statysterka jest OK (dopisz np. TVN, jeśli zechcesz).
export const BIG_PRODUCTION = [
  { re: /\btvp\d?\b/, label: 'TVP' },
  { re: /\bnetflix\w*/, label: 'Netflix' },
  { re: /\bcanal\s*(\+|plus\b)/, label: 'Canal+' },
  { re: /\bhbo\b/, label: 'HBO' },
  { re: /\bpolsat\w*/, label: 'Polsat' },
];
// Gdzie statysterka jest OK: Śląsk i Kraków.
export const LOCAL = [
  /\bkrakow\w*/, /\bnowa huta\b|\bnowej hucie\b/, /\bwieliczk\w*/,
  /\bslask\w*/, /\bsilesia\w*/, /\bkatowic\w*/, /\bgliwic\w*/, /\bchorzow\w*/, /\bbytom\w*/,
  /\bsosnowc\w*|\bsosnowiec\b/, /\bzabrz\w*/, /\btychy\b|\btychach\b/, /\brybnik\w*/,
  /\bmikolow\w*/, /\bsiemianowic\w*/, /\bdabrow\w* gornicz\w*/, /\bjaworzn\w*/,
  /\bbielsk\w*/, /\bczestochow\w*/,
];
export const OTHER_CITY = [
  /\bwarszaw\w*/, /\bwroclaw\w*/, /\bgdansk\w*/, /\bgdyni\w*/, /\bsopot\w*/, /\blodz\w*/,
  /\bpoznan\w*/, /\bszczecin\w*/, /\blublin\w*/, /\bbialymstoku\b|\bbialystok\w*/, /\btorun\w*/,
  /\bbydgoszcz\w*/, /\brzeszow\w*/, /\bkielc\w*/, /\bolsztyn\w*/, /\bopol\w*/,
];

// ── Sesje foto i modeling ───────────────────────────────────────────────
export const PHOTO_SESSION = [
  /\bsesj\w* (zdjeciow|foto|fotograficzn|portfolio|beauty|bielizn)\w*/, /\bdo sesji\b/,
  /\bfotograf\w* (szuk|poszuk)\w*/, /\btfp\b/, /\bphoto ?shoot\w*/,
];
export const MODELING = [
  /\bmodelk\w*/, /\bmodelek\b/, /\bmodel(l)?ing\w*/, /\bpokaz\w* mody\b/, /\bwybieg\w*/,
  /\bmodels? (wanted|needed|call)\b/,
];

// ── Twoja lista „NIE” z Receptury ───────────────────────────────────────
// Dalekie miasta: tylko z konkretną rolą (główna/drugoplanowa/epizod) albo w filmie/serialu/teatrze/dubbingu.
export const FAR_CITY = /\bwarszaw\w*|\blodz\w*|\bgdansk\w*/;
// Poza emploi (chyba że ogłoszenie mówi o konkretnej roli).
export const OFF_EMPLOI = [
  { re: /\bhost(essa|esse|ess|ki|ka)?\b|\bhostess\w*/, label: 'hostessa/host — poza emploi' },
  { re: /\btik\s?tok\w*|\binfluencer\w*|\bugc\b/, label: 'TikTok/influencer — poza emploi' },
  { re: /\breality\b|\bmalzenst\w*|\bpar(y|ami) (do|z)\b|\bpary\b[^.\n]{0,30}\bprogram\w*/, label: 'reality show / pary — poza emploi' },
];
// Tylko osoby z innego miasta / inny typ urody / usługi i warsztaty zamiast castingu.
export const ONLY_OTHER_CITY = /\btylko (osoby|dla osob|kandydaci|mieszkancy)\w* (z|ze) (wroclaw|warszaw|lodz|gdansk|poznan|szczecin|lublin|bialymstok|bydgoszcz|torun|trojmiast)\w*/;
export const OTHER_LOOK = /\b(azjatyck|afrykansk|ciemnoskor|latynosk|arabsk)\w*|\b(asian|african|black|latina|latino) (appearance|actress|look)/;
export const SERVICE = /\bkursan\w*|\bwarsztat\w*|\bworkshop\w*|\bcoaching\w*|\boferuje\b|\bkurs\w* (aktorsk|online)|\bszkoleni\w*|\bmontaz\w* (demo|showreel)/;
// Szukają ekipy, nie obsady.
export const CREW = /\b(dzwiekowc|dzwiek\w* na plan|charakteryzacj|operator\w* (kamery|obrazu)|montazyst|scenograf|charakteryzator|kostiumograf|oswietleniowc|kompozytor|producent\w*|rezyser\w* (swiatla|dzwieku)|kierownik\w* produkcji|asystent\w* produkcji|crew\b|sound (engineer|recordist)|camera operator|editor\b)\w*/;
export const ACTOR_WORDS = /\baktor\w*|\bobsad\w*|\brol(a|e|i|ach|ami)?\b|\bstatys\w*|\bepizod\w*|\bactress\w*|\bactors?\b|\bcast(ing)?\b/;
// Litery spoza alfabetu PL/EN (czeski, słowacki, łotewski, litewski, węgierski…) — 3+ = obcy język.
export const FOREIGN_LETTERS = /[āēīūļľĺŕķņňģčšžřťďěůőűėįųôä]/gi;
// Najczęstsze słowa PL i EN — po nich poznajemy, czy ogłoszenie jest w zrozumiałym języku.
export const PL_EN_WORDS = new Set('i w na z do nie jest sie oraz dla od po jak ze to o a lub czy ktory ktora ktore jestesmy szukamy poszukujemy osoby osob rola roli role aktor aktorka aktorki zdjecia termin zgloszenia wiek lat mile widziane praca the and for to of in with is are we you our your looking seeking role roles actor actress actors casting must be will from on at this that'.split(' '));
// Typowe słowa innych języków (de, ro, lv, lt, es, it, cs/sk, fr) — bez słów wspólnych z PL/EN.
export const FOREIGN_WORDS = new Set('und der die das eine ein einen fuer mit bitte wir suchen sind nicht oder auch si pentru cu pana intre ani cautam trimiteti sau un lidz uz ar ir vai gadiem su iki metu y el los las para con per che di il della una sono hledame pro jsme hladame alebo les des pour avec nous'.split(' '));
// Ktoś przedstawia siebie (aktorka, fotograf, fundubber) zamiast szukać obsady.
export const SELF_PROMO = /^\W*(?:(?:hej\w*|czesc|siema\w*|witam\w*|dzien dobry)\W+)?(?:jestem|nazywam sie|mam na imie)\b/;
export const SEEKING = /\bszuka\w* (?:\w+ )?(?:aktor|osob|obsad|kobiet|dziewczyn|mezczyzn|chlopak|statys|do (?:roli|filmu|spotu|projektu|etiudy|serialu))|\bposzukuj\w*|\bposzukiwan\w*|\bpotrzebuj\w*|\bcasting\w*|\bobsad\w*/;
// Powiadomienia administracyjne z FB (prośby o dołączenie itp.).
export const FB_ADMIN = /prosi o dolaczenie|zaprasza cie do grupy|nowi czlonkowie/;
// Pytania i dyskusje zamiast ogłoszeń.
export const QUESTION = /\bczy (ktos|jakies|jest|sa|wiecie|moze ktos)\b|\bpolec(i|icie|ilibyscie)\b|\bmacie (jakies|doswiadczeni)\w*|\bmam pytanie\b|\bjak (sie|zaczac)\b/;
export const OFFER = /\bszukamy\b|\bposzukujemy\b|\bposzukiwan\w*|\bzapraszamy\b|\bnabor\w*/;

// ── Platformy, które odrzucasz ──────────────────────────────────────────
export const BLOCKED_PLATFORMS = [{ re: /acmodasi/, label: 'platforma acmodasi.pl' }];

// ── Atuty (plusy w ocenie) ──────────────────────────────────────────────
export const SKILLS = [
  { re: /\b(rp|received pronunciation|british accent)\b|\bakcent\w* brytyjsk\w*|\bbrytyjsk\w* akcent\w*/, label: 'akcent RP — Twój mocny atut' },
  { re: /\bangielsk\w*|\benglish\b|\bdwujezyczn\w*|\bbilingual\b/, label: 'angielski (masz C1, akcent RP)' },
  { re: /\bjazd\w* konn\w*|\bkonno\b|\bna koniu\b|\bhorse ?riding\b|\bride a horse\b|\bequestrian\b/, label: 'jazda konna (masz poziom podstawowy)' },
  { re: /\btaniec\b|\btanc\w*|\btaniecz\w*|\bdanc\w*|\bchoreograf\w*|\bbalet\w*|\bballet\b/, label: 'taniec — Twój atut' },
  { re: /\bpianin\w*|\bfortepian\w*|\bpianist\w*|\bpiano\b/, label: 'pianino — Twój atut' },
  { re: /\bslowiansk\w*|\bslavic\b|\beastern european\b|\bwschodnioeuropejsk\w*/, label: 'słowiański typ urody — pasuje' },
];
export const ADVANCED_RIDING = /\b(zaawansowan\w*|doswiadczon\w*|biegl\w*|wyczynow\w*|skok\w* przez przeszkod\w*|advanced|experienced|expert)\b[^.\n]{0,40}\b(jazd\w* konn\w*|jezdzi\w*|jezdziec\w*|konn\w*|koniu|riding|rider)\b|\b(jazd\w* konn\w*|riding)\b[^.\n]{0,30}\b(zaawansowan\w*|advanced|expert)\b/;
export const INTERNATIONAL = /\bspotlight\b|\buk\b|\blondon\b|\blondyn\w*|\binternational\b|\bmiedzynarodow\w*|\bzagraniczn\w* produkcj\w*/;
export const SHORT_HINT = /\bniska\b|\bniskiego wzrostu\b|\bdrobna\b|\bpetite\b/;

// ── Oszustwa ────────────────────────────────────────────────────────────
// strong = jeden wystarczy; weak = jeden daje ostrzeżenie, dwa naraz = oszustwo.
export const SCAM_STRONG = [
  { re: /magia\s*2026/, label: 'znany wzorzec oszustwa „MAGIA2026”' },
  { re: /\bsiri\s*models?\b/, label: 'znany wzorzec oszustwa „Siri Models”' },
  { re: /\bwpisow\w*|\bkaucj\w*/, label: 'opłata od aktorki (wpisowe/kaucja)' },
  { re: /\b(oplat\w*|wplat\w*)\s+(rejestracyjn|wpisow|manipulacyjn|administracyjn|czlonkowsk|jednorazow|za (udzial|casting|zgloszeni|rejestracj|wpis|sesj|portfolio|book|zdjeci|kurs|warsztat|profil|baz))\w*/, label: 'opłata od aktorki' },
  { re: /\b(koszt|koszty|cena)\s+(udzialu|sesji|portfolio|booka?|castingu|rejestracji|wpisu|kursu|profilu)\b/, label: 'opłata od aktorki (koszt udziału/sesji)' },
  { re: /\b(nalezy|trzeba|musisz|wystarczy|prosimy o)\s+(wplacic|zaplacic|oplacic|uiscic|przelac|wplate|oplate|przelew)\b/, label: 'prośba o wpłatę' },
  { re: /\b(registration|application|casting|admin(istration)?|joining) fee\b|\bpay (a |the )?fee\b/, label: 'opłata od aktorki (fee)' },
  { re: /\bgwarant\w*\s+(rol|angaz|udzial|prac|wystep|zarob|sukces)\w*|\b(rola|angaz|udzial)\s+gwarantowan\w*|\bguaranteed (role|part|booking|work)\b/, label: '„gwarantowana rola”' },
  { re: /\bhasl\w* do (konta|poczty|facebooka|instagrama|profilu|skrzynki)\b/, label: 'prośba o hasło do konta (phishing)' },
];
const MESSENGER_WORD = String.raw`(?:whats\s*app|telegram\w*|line\s*(?:id|app)|(?:przez|na|via|on)\s+line)`;
export const MESSENGER = new RegExp(String.raw`\b${MESSENGER_WORD}\b`);
export const MESSENGER_ONLY = new RegExp(
  String.raw`\b(?:tylko|wylacznie|jedynie|only)\b[^.\n]{0,40}\b${MESSENGER_WORD}\b|\b${MESSENGER_WORD}\b[^.\n]{0,25}\b(?:tylko|wylacznie|jedynie|only)\b`,
);
export const SCAM_PHONES = ['782033833'];
export const SCAM_WEAK = [
  { re: /\bhasl(o|a|em|u)\b(?!\s+reklamow)/, label: 'prośba o „hasło” — sprawdź, czy to nie oszustwo' },
  { re: /\bpesel\w*|\bskan\w* (dowodu|paszportu)\b|\bnumer\w* (dowodu|konta bankowego)\b/, label: 'prośba o dane osobowe już na etapie zgłoszenia' },
  { re: /\b(zdjec\w*|foto\w*|photos?)\b[^.\n]{0,30}\b(bielizn\w*|nago|nude|topless|bikini|kostium\w* kapielow\w*)/, label: 'prośba o zdjęcia w bieliźnie/nago' },
];
