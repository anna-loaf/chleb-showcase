import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDeadline, parseAges, parseHeights, findCastingDirector, findPhones, findTitle } from '../shared/parse.js';

const TODAY = '2026-09-27';

test('deadline: różne formaty', () => {
  assert.equal(findDeadline('Zgłoszenia do 15 października', TODAY), '2026-10-15');
  assert.equal(findDeadline('deadline: 03.10.2026', TODAY), '2026-10-03');
  assert.equal(findDeadline('Termin zgłoszeń: 2026-11-02', TODAY), '2026-11-02');
  assert.equal(findDeadline('Self-tapes by 20 October', TODAY), '2026-10-20');
  assert.equal(findDeadline('Apply by October 5th, 2026', TODAY), '2026-10-05');
  assert.equal(findDeadline('CV i zdjęcia do 12.10.', TODAY), '2026-10-12');
});

test('deadline: rok przechodzi na następny', () => {
  assert.equal(findDeadline('Zgłoszenia do 10.01', '2026-12-20'), '2027-01-10');
});

test('deadline: termin zdjęć to nie deadline', () => {
  assert.equal(findDeadline('Termin zdjęć: 20.10. Zgłoszenia do 12.10', TODAY), '2026-10-12');
  assert.equal(findDeadline('Zdjęcia od 10.10 do 15.10 w Krakowie', TODAY), null);
  assert.equal(findDeadline('Czekamy na zgłoszenia do piątku', TODAY), null);
});

test('deadline: nazwa miesiąca nie myli się z „decyzją”', () => {
  assert.equal(findDeadline('Zgłoszenia: 5 decyzji podejmiemy szybko', TODAY), null);
});

test('wiek: zakresy i formy opisowe', () => {
  assert.deepEqual(parseAges('kobieta w wieku 18-24 lat'), [[18, 24]]);
  assert.deepEqual(parseAges('Kobieta 20-25 (rola epizodyczna) oraz mężczyzna 40-50'), [[20, 25], [40, 50]]);
  assert.deepEqual(parseAges('playing age 18-24'), [[18, 24]]);
  assert.deepEqual(parseAges('szukamy 20-latki'), [[20, 24]]);
  assert.deepEqual(parseAges('Aktorki 18+'), [[18, 99]]);
  assert.deepEqual(parseAges('in her early 20s'), [[20, 23]]);
  assert.deepEqual(parseAges('nastolatka do serialu'), [[13, 19]]);
  assert.deepEqual(parseAges('Kobieta, 45 lat'), [[45, 45]]);
});

test('wiek: nie myli dat, wzrostu ani doświadczenia z wiekiem', () => {
  assert.deepEqual(parseAges('Zdjęcia 15-20.10, wzrost 155-165 cm'), []);
  assert.deepEqual(parseAges('Wymagane 5 lat doświadczenia w teatrze'), []);
  assert.deepEqual(parseAges('Rok produkcji 2026-2027'), []);
});

test('wzrost', () => {
  assert.deepEqual(parseHeights('wzrost 155-165 cm'), [[155, 165]]);
  assert.deepEqual(parseHeights('wzrost min. 170 cm'), [[170, 250]]);
  assert.deepEqual(parseHeights('do 160 cm'), [[0, 160]]);
});

test('reżyser castingu i telefony', () => {
  assert.equal(findCastingDirector('Opis\nReżyserka castingu: Maria Nowak (Studio X)'), 'Maria Nowak (Studio X)');
  assert.equal(findCastingDirector('Casting director – John Smith'), 'John Smith');
  assert.deepEqual(findPhones('tel. 600 700 800 lub +44 7700 900123'), ['600 700 800', '+44 7700 900123']);
});

test('tytuł: z tematu maila albo pierwszej linii', () => {
  assert.equal(findTitle({ subject: 'Fwd: Re: Casting do serialu', text: 'x' }), 'Casting do serialu');
  assert.equal(findTitle({ text: '\n  \nRola w spektaklu „Wesele”\nopis' }), 'Rola w spektaklu „Wesele”');
  assert.equal(
    findTitle({ text: 'Casting do serialu Netflix - rola drugoplanowa. Poszukujemy aktorki w wieku 18-24 lat, typ słowiański.' }),
    'Casting do serialu Netflix - rola drugoplanowa',
  );
});
