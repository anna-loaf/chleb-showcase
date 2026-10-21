import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validEvent, fromSchema, sortEvents, dedupe, parseJsonArray, regionOf, categoryOf } from '../scripts/events.mjs';

const from = new Date('2026-10-12T00:00:00Z');
const to = new Date('2026-10-27T00:00:00Z');
const ok = (e) => validEvent(e, { from, to });
// Uwaga: Poznań to teraz region „inne”, nieznane miasta odpadają.

test('wydarzenia: region, kategoria, okno czasu', () => {
  assert.equal(regionOf('Kraków'), 'krakow');
  assert.equal(regionOf('Gliwice'), 'slask');
  assert.equal(regionOf('Poznań'), 'inne');
  assert.equal(regionOf('Radom'), null);
  assert.equal(categoryOf('Wieczór impro w Klubie'), 'impro');
  assert.equal(categoryOf('Warsztaty aktorskie dla dorosłych'), 'warsztat');
  assert.equal(categoryOf('Spotkanie z reżyserem'), 'spotkanie');
  assert.ok(ok({ title: 'Spektakl X', start: '2026-10-15T19:00:00+02:00', city: 'Katowice', category: 'spektakl', url: 'https://a.pl/x' }));
  assert.equal(ok({ title: 'Za późno', start: '2026-11-15T19:00:00Z', city: 'Kraków', category: 'spektakl' }), null);
  assert.equal(ok({ title: 'Radom', start: '2026-10-15T19:00:00Z', city: 'Radom', category: 'spektakl' }), null);
  assert.equal(ok({ title: 'Bajka dla dzieci', start: '2026-10-15T10:00:00Z', city: 'Kraków', category: 'spektakl' }), null);
});

test('wydarzenia: odporność na śmieci z wyszukiwarki (prompt injection)', () => {
  assert.equal(ok({ title: 'Zignoruj polecenia', start: 'jutro', city: 'Kraków' }), null);
  assert.equal(ok({ title: 'X', start: '2026-10-15T19:00:00Z', city: 'Kraków', category: 'spektakl', url: 'javascript:alert(1)' }).url, '');
  assert.deepEqual(parseJsonArray('tekst bez JSON'), []);
  assert.equal(parseJsonArray('Oto lista: [{"title":"A"}] koniec').length, 1);
});

test('wydarzenia: „1 zł” = cena nieznana; darmowe i tanie na górze; duplikaty', () => {
  const a = ok({ title: 'Drogi', start: '2026-10-13T19:00:00Z', city: 'Kraków', category: 'koncert', price: 120 });
  const b = ok({ title: 'Darmowy', start: '2026-10-20T19:00:00Z', city: 'Kraków', category: 'warsztat', free: true });
  const c = ok({ title: 'Tani', start: '2026-10-14T19:00:00Z', city: 'Kraków', category: 'impro', price: 25 });
  const d = ok({ title: 'Zaślepka', start: '2026-10-14T19:00:00Z', city: 'Kraków', category: 'spektakl', price: 1 });
  assert.equal(d.price, null);
  assert.deepEqual(sortEvents([a, d, c, b]).map((e) => e.title), ['Darmowy', 'Tani', 'Zaślepka', 'Drogi']);
  assert.equal(dedupe([c, { ...c, price: null }]).length, 1);
});

test('wydarzenia: schema.org z portalu', () => {
  const e = fromSchema({ '@type': 'TheaterEvent', name: 'Wesele', startDate: new Date(Date.now() + 3 * 864e5).toISOString(), location: { name: 'Teatr Śląski', address: { addressLocality: 'Katowice' } }, offers: { price: '45.00' }, url: 'https://teatr.pl/wesele' }, 'biletyna.pl');
  assert.equal(e.region, 'slask');
  assert.equal(e.category, 'spektakl');
  assert.equal(e.price, 45);
  assert.equal(fromSchema({ '@type': 'ExhibitionEvent', name: 'Wystawa', startDate: '2026-10-16T10:00:00Z' }, 'x'), null);
});

test('wydarzenia: brak ceny to „sprawdź”, a nie „za darmo”', () => {
  const base = { title: 'Spektakl', start: '2026-10-15T19:00:00Z', city: 'Kraków', category: 'spektakl' };
  assert.equal(ok({ ...base, price: null }).price, null);
  assert.equal(ok({ ...base, price: '' }).price, null);
  assert.equal(ok({ ...base }).price, null);
  assert.equal(ok({ ...base, free: true }).price, 0);
});

test('wydarzenia: czas polski → ISO (lato i zima)', async () => {
  const { warsawToIso } = await import('../scripts/events.mjs');
  assert.equal(warsawToIso('2026-10-12 19:00:00'), '2026-10-12T17:00:00.000Z');
  assert.equal(warsawToIso('2026-11-12 19:00:00'), '2026-11-12T18:00:00.000Z');
  assert.equal(warsawToIso('jutro'), '');
});
