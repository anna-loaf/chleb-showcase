import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessCasting } from '../shared/filter.js';

const TODAY = '2026-09-27';
const check = (text, opts = {}) => assessCasting({ text, from: opts.from ?? 'manual', subject: opts.subject ?? '' }, TODAY);
const has = (res, fragment) => res.reasons.some((r) => r.text.includes(fragment));

test('trafienie: serial Netflix, kobieta 18–24, słowiański typ, angielski', () => {
  const r = check(`Casting do serialu dla Netflix — rola drugoplanowa
Poszukujemy aktorki w wieku 18-24 lat, typ słowiański, mile widziana znajomość języka angielskiego.
Zdjęcia: Kraków, listopad 2026.
Zgłoszenia (zdjęcia + CV) do 15.10 na adres casting@produkcja.pl
Reżyser castingu: Anna Kowalska`);
  assert.equal(r.verdict, 'match');
  assert.ok(has(r, 'rola drugoplanowa'));
  assert.ok(has(r, 'wiek 18–24'));
  assert.ok(has(r, 'słowiański'));
  assert.ok(has(r, 'angielski'));
  assert.ok(has(r, 'Kraków/Śląsk'));
  assert.equal(r.fields.deadline, '2026-10-15');
  assert.equal(r.fields.contact, 'casting@produkcja.pl');
  assert.equal(r.fields.castingDirector, 'Anna Kowalska');
});

test('odrzuca rolę męską', () => {
  const r = check('Szukamy mężczyzny w wieku 20-25 lat do reklamy piwa. Kontakt: casting@firma.pl');
  assert.equal(r.verdict, 'reject');
  assert.ok(has(r, 'rola męska'));
});

test('odrzuca wiek powyżej 24', () => {
  const r = check('Casting do filmu fabularnego: kobieta 35-45 lat, rola główna. casting@film.pl');
  assert.equal(r.verdict, 'reject');
  assert.ok(has(r, 'wiek 35–45'));
});

test('odrzuca ogłoszenia dla dzieci', () => {
  const r = check('Casting dla dzieci w wieku 6-12 lat do reklamy zabawek. Zgłoszenia: kids@agencja.pl');
  assert.equal(r.verdict, 'reject');
  assert.ok(has(r, 'dla dzieci'));
});

test('odrzuca statysterkę w filmie studenckim', () => {
  const r = check('Etiuda studencka PWSFTviT — szukamy statystów do sceny w klubie, Łódź, 20.10. film@student.pl');
  assert.equal(r.verdict, 'reject');
  assert.ok(has(r, 'filmie studenckim'));
});

test('statysterka OK: duża produkcja (TVP) na Śląsku', () => {
  const r = check('Statyści do serialu TVP — zdjęcia w Katowicach, kobiety i mężczyźni 18-60 lat. Zgłoszenia do 10.10: statysci@tvp.pl');
  assert.equal(r.verdict, 'match');
  assert.equal(r.fields.deadline, '2026-10-10');
});

test('odrzuca statysterkę dużej produkcji poza Śląskiem i Krakowem', () => {
  const r = check('Netflix — poszukujemy statystów, zdjęcia w Warszawie, kobiety 18-30. ekipa@netflix-extras.pl');
  assert.equal(r.verdict, 'reject');
  assert.ok(has(r, 'poza Śląskiem i Krakowem'));
});

test('odrzuca statysterkę poza dużą produkcją', () => {
  const r = check('Statyści do teledysku, Kraków, kobiety 18-25. teledysk@muzyka.pl');
  assert.equal(r.verdict, 'reject');
  assert.ok(has(r, 'poza dużą produkcją'));
});

test('odrzuca sesje u fotografa i modeling', () => {
  const r = check('Fotograf poszukuje modelek do sesji zdjęciowej TFP w Krakowie, dziewczyny 18-25. foto@foto.pl');
  assert.equal(r.verdict, 'reject');
});

test('odrzuca platformę acmodasi.pl', () => {
  const r = check('Nowe ogłoszenie na acmodasi.pl: film krótkometrażowy, aktorka 20-25');
  assert.equal(r.verdict, 'reject');
  assert.ok(has(r, 'acmodasi'));
});

test('oszustwo: gwarantowana rola + tylko WhatsApp + zagraniczny numer', () => {
  const r = check('Casting do reklamy! Gwarantowana rola, kontakt tylko przez WhatsApp +44 7700 900123');
  assert.equal(r.verdict, 'scam');
  assert.ok(has(r, 'gwarantowana rola'));
  assert.ok(has(r, 'komunikator'));
});

test('oszustwo: opłata od aktorki', () => {
  const r = check('Rola w serialu — wymagana opłata rejestracyjna 150 zł za wpis do bazy. info@baza.pl');
  assert.equal(r.verdict, 'scam');
});

test('oszustwo: znane wzorce MAGIA2026, 782033833, Siri Models', () => {
  assert.equal(check('Aktorka 20 lat do filmu. W wiadomości wpisz MAGIA2026. film@x.pl').verdict, 'scam');
  assert.equal(check('Rola w serialu, kobieta 18-25, dzwoń: 782 033 833').verdict, 'scam');
  assert.equal(check('Siri Models zaprasza na casting do reklamy, kobiety 18-25. mail@siri.pl').verdict, 'scam');
});

test('„hasło” samo daje ostrzeżenie (warto zerknąć), nie kosz', () => {
  const r = check('Casting do spektaklu — kobieta 20-25. W temacie maila wpisz hasło: SPEKTAKL. teatr@teatr.pl');
  assert.equal(r.verdict, 'maybe');
  assert.ok(has(r, 'hasło'));
});

test('hasło reklamowe to nie sygnał oszustwa', () => {
  const r = check('Reklama TV — kobieta 18-25 lat, nagranie hasła reklamowego. spot@agencja.pl');
  assert.equal(r.verdict, 'match');
});

test('uboga treść z Facebooka → warto zerknąć, nie odrzucać', () => {
  const r = check('Anna Nowak dodała post w grupie Castingi Kraków: Szukam osoby do krótkiego projektu, szczegóły na priv', {
    from: 'groupupdates@facebookmail.com',
  });
  assert.equal(r.verdict, 'maybe');
});

test('niepełne dane (brak wieku) → warto zerknąć', () => {
  const r = check('Szukamy aktorki do roli głównej w filmie krótkometrażowym. Zgłoszenia: film@krotki.pl');
  assert.equal(r.verdict, 'maybe');
  assert.ok(has(r, 'wieku'));
});

test('zaawansowana jazda konna obniża do „warto zerknąć”', () => {
  const r = check('Film historyczny: kobieta 18-25, rola epizodyczna, wymagana zaawansowana jazda konna. hist@film.pl');
  assert.equal(r.verdict, 'maybe');
  assert.ok(has(r, 'zaawansowana jazda konna'));
});

test('ogłoszenie po angielsku (Spotlight): RP, eastern european, deadline', () => {
  const r = check(
    "Feature film 'Winter Light' — seeking female, playing age 18-24, Eastern European look, RP accent essential. Self-tapes by 20 October 2026.",
    { from: 'link@spotlight.com' },
  );
  assert.equal(r.verdict, 'match');
  assert.ok(has(r, 'akcent RP'));
  assert.ok(!has(r, 'angielski (masz C1'), 'RP zastępuje ogólny angielski');
  assert.equal(r.fields.deadline, '2026-10-20');
});

test('dwie role (kobieta 20–25 i mężczyzna 40–50) → pasuje', () => {
  const r = check('Serial Polsat: kobieta 20-25 (rola epizodyczna) oraz mężczyzna 40-50. polsat@casting.pl');
  assert.equal(r.verdict, 'match');
});

test('wymagany wzrost 170+ → ostrzeżenie', () => {
  const r = check('Reklama: kobieta 18-25, wzrost min. 170 cm. reklama@x.pl');
  assert.equal(r.verdict, 'maybe');
  assert.ok(has(r, 'wymagany wzrost'));
});

test('słowa „online” i „deadline” nie są komunikatorem Line', () => {
  const r = check('Casting online do serialu, kobieta 18-24, deadline 12.10. Nagrania wysyłaj na serial@tv.pl');
  assert.notEqual(r.verdict, 'scam');
});

test('lista NIE: Warszawa bez konkretnej roli (zwykła stawka) → odrzucone', () => {
  const r = check('WARSZAWA | 7, 8 i 9 PAŹDZIERNIKA 💰 Reklama, kobiety 18-30, stawka 300 zł. Zgłoszenia: ekipa@reklama.pl');
  assert.equal(r.verdict, 'reject');
  assert.ok(has(r, 'Warszawa'));
});

test('Warszawa z konkretną rolą w serialu → zostaje', () => {
  const r = check('Warszawa, serial TVN — rola epizodyczna, kobieta 20-24. casting@serial.pl');
  assert.notEqual(r.verdict, 'reject');
});

test('poza emploi: hostessa, TikTok, pary do programu', () => {
  assert.equal(check('Poszukujemy hostessy na event w Krakowie, kobiety 18-25. host@event.pl').verdict, 'reject');
  assert.equal(check('CASTING – TIKTOK, szukamy osób 18-25 do nagrań. tt@marka.pl').verdict, 'reject');
  assert.equal(check('Cała Polska. Poszukujemy małżeństw i par do programu dla stacji Polsat. mail@tv.pl').verdict, 'reject');
});

test('pytanie zamiast ogłoszenia → odrzucone', () => {
  const r = check('Hej! Mam pytanie, czy ktoś może polecić sprawdzoną agencję aktorską? Interesuje mnie serial, reklama, film.');
  assert.equal(r.verdict, 'reject');
});

test('dzieci 6–10 lat mimo słowa „młodzież” → odrzucone', () => {
  const r = check('Szukamy dzieci w wieku 6-10 lat do naszej grupy teatralnej dla dzieci i młodzieży. teatr@dom.pl');
  assert.equal(r.verdict, 'reject');
});

test('szukają ekipy, nie obsady → odrzucone; casting z ekipą → zostaje', () => {
  assert.equal(check('Współpraca z Filmówką: szukamy dźwiękowca do etiudy, zdjęcia w Krakowie 15.10. film@student.pl').verdict, 'reject');
  assert.notEqual(check('Etiuda: szukamy aktorki 20-24 do roli głównej oraz dźwiękowca. film@student.pl').verdict, 'reject');
});

test('ogłoszenie po słowacku → odrzucone', () => {
  assert.equal(check('Čau, aktieri! Hľadáme herečku 20-25 rokov do reklamy v Bratislave. info@sk.sk').verdict, 'reject');
});

test('ogłoszenie po łotewsku → odrzucone, polskie znaki nie przeszkadzają', () => {
  assert.equal(check('STEIDZAMI MEKLĒJAM 3 DRAG QUEENS RĪTDIENAS FILMĒŠANAI! Sieviete 20-25, reklāma. info@lv.lv').verdict, 'reject');
  assert.notEqual(check('Żółć gęślą jaźń — casting do serialu, kobieta 20-24, rola epizodyczna. casting@tv.pl').verdict, 'reject');
});

test('obce języki bez charakterystycznych liter → odrzucone; PL i EN zostają', () => {
  const de = 'Wir suchen eine Schauspielerin zwischen 20 und 25 Jahren fuer einen Werbefilm in Berlin. Bitte schickt eure Bewerbung mit Fotos bis Freitag an casting@agentur.de';
  const ro = 'Cautam o actrita intre 20 si 25 de ani pentru un film publicitar la Bucuresti. Trimiteti CV si fotografii pana vineri la casting@agentie.ro';
  const ru = 'Ищем актрису от 20 до 25 лет для съемок рекламы в Варшаве. Присылайте фото и резюме на почту casting@agency.ru до пятницы';
  const lv = 'Steidzami mekleju aktrisi vecuma no 20 lidz 25 gadiem reklamas filmesanai Riga. Sutiet foto un CV lidz piektdienai uz casting@lv.lv';
  for (const t of [de, ro, ru, lv]) assert.equal(check(t).verdict, 'reject', t.slice(0, 30));
  assert.notEqual(check('Szukamy aktorki w wieku 20-24 lat do roli epizodycznej w serialu. Zgłoszenia do 20.10 na casting@tv.pl, zdjęcia i CV mile widziane.').verdict, 'reject');
  assert.notEqual(check('We are looking for a female actor, playing age 18-24, for a supporting role in a feature film. Self-tapes to casting@film.co.uk by 20 October.').verdict, 'reject');
});

test('skan tygodnia: ekipa, autoprezentacja, nie-casting, wiek w nawiasie, mail z FB', () => {
  assert.equal(check('🎤 Dźwięk na planie. Nagrywanie. Miks. Postprodukcja. Zapraszamy do kontaktu i współpracy.').verdict, 'reject');
  assert.equal(check('Hejka! Nazywam się Maja, jestem aktorką i chętnie dołączę do projektów studenckich.').verdict, 'reject');
  assert.equal(check('Konsultacje scenariuszowe z Olą — zapisy na listopad, dwa wolne terminy.').verdict, 'reject');
  assert.equal(check('Trudne Sprawy (Wrocław). Poszukiwane odtwórczynie ról: Hanna (83) zadbana, z klasą. Kiedy: 1 scena, 19 października.').verdict, 'reject');
  const fb = '=====\nZobacz na Facebooku\nhttps://fb.com/x\n=====\n\nWitaj, Anna!\n\n"Szukam aktorki 18-24 lat do roli głównej w etiudzie, Kraków."\n\n=====\nMeta Platforms Ireland Limited';
  assert.notEqual(check(fb, { from: 'groupupdates@facebookmail.com' }).verdict, 'reject');
});

test('same hashtagi / bez konkretów → Znak zapytania, nie „Warto zerknąć”', () => {
  assert.ok(['unsure', 'reject'].includes(check('📙🎥🎬 #projektlila #TVP3 https://www.filmpolski.pl/fp/index.php?osoba=1144746').verdict));
  assert.equal(check('Szukamy aktorki 18-24 lat do roli w etiudzie, Kraków.').verdict === 'unsure', false);
});
