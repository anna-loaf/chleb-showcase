// „Składniki na dziś” — konkretne zadania rozwojowe (lokalnie, 0 zł).
// Dopisuj śmiało: { text, min } w odpowiednim obszarze.
export const AREAS = {
  agencje: 'Agencje i zgłoszenia',
  warsztat: 'Trening aktorski',
  dykcja: 'Dykcja',
  glos: 'Emisja głosu',
  egzaminy: 'Egzaminy do szkół',
  rynek: 'Świadomość rynku',
  social: 'Social media',
};

export const AGENCIES = ['Agencja A', 'Agencja B', 'Agencja C'];

export const TASK_BANK = {
  agencje: [
    { text: 'Wyślij zgłoszenie do agencji {agency}: 3–4 zdania o sobie, 2–3 aktualne portrety, CV aktorskie i link do self-tape’u lub showreela.', min: 20 },
    { text: 'Zaktualizuj profil w bazie Filmmakers.eu: aktualne zdjęcia, wzrost, umiejętności.', min: 20 },
    { text: 'Napisz do wykładowcy albo absolwenta ze szkoły: z kim warto porozmawiać o castingach lub agencji? Jedno konkretne pytanie.', min: 10 },
    { text: 'Przygotuj szablon maila zgłoszeniowego po polsku i angielsku, który w 2 minuty dopasujesz do każdego castingu.', min: 20 },
    { text: 'Odśwież CV aktorskie: role, etiudy, spektakle, warsztaty, umiejętności. Jedna strona, PDF z imieniem i nazwiskiem w nazwie pliku.', min: 25 },
    { text: 'Przejrzyj Spiżarnię: do których zgłoszeń sprzed ponad 2 tygodni warto wysłać krótkie, uprzejme przypomnienie?', min: 10 },
  ],
  warsztat: [
    { text: 'Monolog 1-minutowy w trzech intencjach: prosić, grozić, uwodzić. Nagraj wszystkie trzy i wybierz najciekawszą wersję.', min: 20 },
    { text: 'Analiza sceny: dla swojej postaci wypisz, czego chce, co jej przeszkadza, co ryzykuje i co się w niej zmienia.', min: 20 },
    { text: 'Film do analizy: „Dekalog I” Kieślowskiego. Zanotuj 3 momenty, w których aktorzy grają pod tekstem — co mówią, a co myślą.', min: 60 },
    { text: 'Obserwacja: 10 minut w tramwaju albo kawiarni — zapamiętaj u jednej osoby chód, gest i rytm mówienia. Wieczorem odtwórz to przez 2 minuty.', min: 15 },
    { text: 'Self-tape na sucho: krótka scena z readerem (albo nagranym głosem), światło z okna na twarz, neutralne tło. Sprawdź dźwięk i eyeline.', min: 30 },
    { text: 'Film do analizy: „Ida” Pawlikowskiego. Zanotuj 2 sceny, w których Agata Trzebuchowska gra samym spojrzeniem.', min: 80 },
    { text: 'Improwizacja solo: 3 minuty rozmowy z wyobrażonym partnerem, któremu musisz przekazać złą wiadomość. Nagraj bez przerywania i bez oceniania.', min: 10 },
  ],
  dykcja: [
    { text: '10 minut łamańców: „Stół z powyłamywanymi nogami”, „W Szczebrzeszynie chrząszcz brzmi w trzcinie”. Najpierw wolno i przesadnie, potem w tempie. Nagraj ostatnie podejście.', min: 10 },
    { text: 'Korek (albo ołówek) w zębach: przeczytaj na głos stronę prozy, potem ten sam fragment bez korka. Porównaj nagrania.', min: 10 },
    { text: 'Rozgrzewka aparatu mowy: 2 minuty język, 2 minuty wargi (parskanie, „u–i”), 2 minuty żuchwa, potem 3 minuty spółgłosek p-t-k, b-d-g.', min: 8 },
    { text: 'Przeczytaj na głos artykuł jak lektorka: wyraźnie, w szybszym tempie, 5 minut. Nagraj i odsłuchaj końcówki wyrazów.', min: 10 },
    { text: 'Angielski RP: 10 minut par wyrazów (ship/sheep, full/fool, cot/caught) i jeden akapit z nagraniem. Odsłuchaj samogłoski.', min: 10 },
    { text: 'Cztery wersy wiersza powiedz trzy razy: szeptem scenicznym, normalnie i do ostatniego rzędu. Każde słowo ma być słyszalne.', min: 10 },
  ],
  glos: [
    { text: 'Oddech przeponowy: 5 serii — wdech nosem na 4, wydech na „sss” przez 10–15 sekund. Dłoń na brzuchu, ramiona w dół.', min: 8 },
    { text: 'Mruczanki na „m” w górę i w dół skali, potem przejście w „ma-me-mi-mo-mu”. Szukaj wibracji w masce (nos, kości policzkowe).', min: 10 },
    { text: 'Jedno zdanie z tekstu powiedz z uśmiechem, „z piersi” i „z głowy”. Nagraj i wybierz brzmienie, które niesie najdalej bez forsowania.', min: 10 },
    { text: 'Podparcie: „ha-ha-ha” staccato na przeponie (3 × 10), potem krótki fragment tekstu mocno, ale bez krzyku.', min: 8 },
    { text: 'Rozśpiewanie 10 minut i Twoja piosenka w całości. Nagraj i posłuchaj intonacji na długich dźwiękach.', min: 15 },
    { text: 'Higiena głosu: dużo wody, zero szeptania przy chrypce, 3 minuty fonacji przez słomkę do szklanki wody.', min: 5 },
  ],
  egzaminy: [
    { text: 'Wybierz wiersz do repertuaru egzaminacyjnego i naucz się pierwszych 8 wersów na pamięć.', min: 20 },
    { text: 'Sprawdź na stronie wybranej szkoły teatralnej aktualne wymagania i terminy rekrutacji. Zapisz je w Recepturze.', min: 15 },
    { text: 'Powiedz tekst egzaminacyjny do kamery, jakby przed Tobą siedziała komisja. Nagraj i wypisz 2 rzeczy do poprawy.', min: 15 },
    { text: 'Odpowiedź na pytanie komisji „Dlaczego aktorstwo?”: 3–4 szczere zdania, bez frazesów. Powiedz je na głos.', min: 10 },
    { text: 'Proza: wybierz fragment, w którym postać czegoś chce od konkretnej osoby. Nazwij tę osobę i to, co chcesz w niej zmienić.', min: 15 },
    { text: 'Piosenka egzaminacyjna a cappella z nagraniem. Czy wiesz, o czym śpiewasz w każdej zwrotce?', min: 15 },
  ],
  rynek: [
    { text: 'Sprawdź napisy końcowe 2 polskich seriali z ostatniego roku: kto robił casting? Zapisz nazwiska.', min: 15 },
    { text: 'Przejrzyj repertuar jednego teatru w Krakowie albo na Śląsku: kto reżyseruje, jakie premiery w sezonie? Zanotuj osobę, z którą chcesz pracować.', min: 15 },
    { text: 'Sprawdź, gdzie szkoły filmowe (Łódź, Katowice, Warszawa) publikują castingi do etiud — role w etiudach to realne doświadczenie.', min: 15 },
    { text: 'Przeczytaj wywiad z reżyserką lub reżyserem castingu i wypisz 3 rzeczy, na które zwracają uwagę w self-tape’ach.', min: 20 },
    { text: 'Sprawdź, jakie produkcje kręcą się teraz na Śląsku i w Krakowie (np. Silesia Film, Krakow Film Commission, lokalne media). Zanotuj tytuły i producentów.', min: 20 },
    { text: 'Obejrzyj zwiastuny 3 nadchodzących polskich premier. Jakie typy kobiet 18–25 w nich grają i gdzie się mieścisz?', min: 15 },
  ],
  social: [
    { text: 'Nagraj 15-sekundową relację zza kulis pracy: rozgrzewka głosu albo praca nad tekstem. Bez perfekcjonizmu.', min: 10 },
    { text: 'Uporządkuj bio: „Aktorka · Kraków/Katowice · PL/EN (RP)” plus link do najlepszego self-tape’u lub showreela.', min: 10 },
    { text: 'Wrzuć jedno aktualne zdjęcie portretowe (naturalne światło, bez filtra) z krótkim opisem, nad czym teraz pracujesz.', min: 15 },
    { text: 'Zaobserwuj 5 kont reżyserów castingu, agencji albo teatrów. Pod jednym postem zostaw merytoryczny komentarz.', min: 10 },
    { text: 'Spójrz na swój profil oczami castingowca: czy w 5 sekund widać, kim jesteś i jak się z Tobą skontaktować? Popraw jedną rzecz.', min: 10 },
  ],
};
