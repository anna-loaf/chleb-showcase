import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDevTasks, castingTasks, devCountFor, swapped } from '../src/lib/tasks.js';
import { buildWelcome, plural } from '../src/lib/welcome.js';
import { nextWindowStart, needsContext, toApiMessages, inWindow } from '../src/lib/chatWindow.js';
import { costUsd, usdToPln, addUsage } from '../src/lib/costs.js';
import { renderContext, buildSystem, DEFAULT_KNOWLEDGE } from '../src/lib/prompt.js';
import { pickTier } from '../src/lib/ai.js';

test('zadania: deterministyczne, 3 różne obszary, rotacja dzień po dniu', () => {
  const a = planDevTasks('2026-09-27');
  assert.deepEqual(a, planDevTasks('2026-09-27'));
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((t) => t.area)).size, 3);
  assert.notDeepEqual(a.map((t) => t.text), planDevTasks('2026-09-28').map((t) => t.text));
  assert.ok(!a.some((t) => t.text.includes('{agency}')));
  const s = swapped(a[0]);
  assert.equal(s.area, a[0].area);
  assert.notEqual(s.text, a[0].text);
});

test('zadania z castingów: self-tape i bliski deadline; wtedy mniej rozwojowych', () => {
  const tasks = castingTasks({
    day: '2026-09-27',
    castings: [{ id: 'c1', title: 'Serial X', status: 'wyrasta', deadline: '2026-09-29' }],
    inbox: [
      { id: 'i1', title: 'Reklama Y', state: 'new', deadline: '2026-09-28' },
      { id: 'i2', title: 'Za daleko', state: 'new', deadline: '2026-10-20' },
    ],
  });
  assert.equal(tasks.length, 2);
  assert.match(tasks[0].text, /self-tape do „Serial X” — deadline 29\.09 \(za 2 dni\)/);
  assert.match(tasks[1].text, /Zdecyduj o „Reklama Y” — deadline jutro/);
  assert.equal(devCountFor(tasks), 1);
  assert.equal(devCountFor([]), 3);
});

test('pop-up: najważniejsze wczorajsze wydarzenie wygrywa', () => {
  const w = buildWelcome({
    today: '2026-09-27',
    castings: [
      { title: 'Film A', statusHistory: [{ status: 'zaczyn', at: '2026-09-26T10:00:00' }] },
      { title: 'Serial B', statusHistory: [{ status: 'w_piecu', at: '2026-09-26T18:00:00' }] },
    ],
    tasks: [{ date: '2026-09-26', done: true, text: 'Dykcja' }],
  });
  assert.equal(w.kind, 'praise');
  assert.equal(w.title, 'Jesteś w piecu!');
  assert.match(w.body, /Serial B/);
  assert.equal(w.extra, '…i jeszcze 2 ruchy z wczoraj.');
});

test('pop-up: zadania z wczoraj → pochwała; nic → motywacja albo ciekawostka', () => {
  const t = buildWelcome({ today: '2026-09-27', tasks: [{ date: '2026-09-26', done: true, text: 'Wyślij zgłoszenie do OPTA' }] });
  assert.equal(t.title, 'Super, wczoraj był konkret!');
  assert.match(t.body, /OPTA/);
  const kinds = new Set(['2026-09-27', '2026-09-28'].map((today) => buildWelcome({ today }).kind));
  assert.deepEqual([...kinds].sort(), ['fact', 'motivation']);
  const old = buildWelcome({ today: '2026-09-27', castings: [{ title: 'X', statusHistory: [{ status: 'zaczyn', at: '2026-09-20T10:00:00' }] }] });
  assert.notEqual(old.kind, 'praise');
});

test('polska odmiana liczebników', () => {
  assert.deepEqual([1, 2, 5, 12, 22, 25].map((n) => plural(n, ['ruch', 'ruchy', 'ruchów'])), ['ruch', 'ruchy', 'ruchów', 'ruchów', 'ruchy', 'ruchów']);
});

test('okno czatu: skokowe przycinanie, start zawsze od wiadomości użytkowniczki', () => {
  const msgs = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, role: i % 2 ? 'assistant' : 'user', text: `m${i + 1}` }));
  assert.equal(nextWindowStart(msgs.slice(0, 23), 0), 0);
  const start = nextWindowStart(msgs, 0);
  const kept = inWindow(msgs, start);
  assert.equal(kept[0].role, 'user');
  assert.ok(kept.length <= 11);
  assert.equal(nextWindowStart([...msgs.slice(start - 1), { id: 25, role: 'assistant' }], start), start, 'okno stoi w miejscu między skokami');
});

test('kontekst dnia: dołączany tylko przy zmianie; format wiadomości API', () => {
  const w = [{ id: 1, role: 'user', text: 'hej', context: 'K1' }, { id: 2, role: 'assistant', text: 'cześć' }];
  assert.equal(needsContext(w, 'K1'), false);
  assert.equal(needsContext(w, 'K2'), true);
  assert.equal(needsContext([], 'K1'), true);
  assert.deepEqual(toApiMessages(w)[0].content, [{ type: 'text', text: 'K1' }, { type: 'text', text: 'hej' }]);
  assert.deepEqual(toApiMessages(w)[1].content, [{ type: 'text', text: 'cześć' }]);
});

test('koszty: cennik Sonnet 5, cache, VAT i kurs', () => {
  const usd = costUsd('claude-sonnet-5', { input_tokens: 1000, output_tokens: 400, cache_read_input_tokens: 3000, cache_creation_input_tokens: 500 });
  // 1000×2 + 400×10 + 3000×0.2 + 500×2.5 = 2000 + 4000 + 600 + 1250 = 7850 / 1e6
  assert.equal(Number(usd.toFixed(6)), 0.00785);
  assert.equal(costUsd('tryb-probny', { output_tokens: 1000 }), 0);
  assert.ok(Math.abs(usdToPln(10, { usdPln: 3.85, vatPercent: 23 }) - 47.355) < 1e-9);
  const m = addUsage('2026-09', null, 'claude-haiku-4-5', { input_tokens: 1_000_000, output_tokens: 0 });
  assert.equal(m.usd, 1);
  assert.equal(m.requests, 1);
});

test('prompt: system stały, kontekst deterministyczny', () => {
  const sys = buildSystem(DEFAULT_KNOWLEDGE);
  assert.equal(sys.length, 2);
  assert.equal(sys[1].cache, true);
  assert.match(sys[1].text, /165 cm/);
  const data = {
    today: '2026-09-27',
    tasks: [{ text: 'Dykcja 10 min', done: true }],
    inbox: [{ state: 'new', title: 'Serial X', source: 'EasyCasting', verdict: 'match', deadline: '2026-10-01' }],
    castings: [{ title: 'Film A', status: 'zaczyn', appliedAt: '2026-09-20', source: 'Spotlight' }],
  };
  const ctx = renderContext(data);
  assert.equal(ctx, renderContext(data));
  assert.match(ctx, /niedziela, 27 września 2026/);
  assert.match(ctx, /\[x\] Dykcja 10 min/);
  assert.match(ctx, /Serial X \(EasyCasting; filtr: Pasuje; deadline 2026-10-01\)/);
  assert.match(ctx, /Zaczyn \(zgłoszona\)/);
});

test('routing modeli: domyślnie zawsze Sonnet; Haiku tylko po włączeniu i dla prostych', () => {
  assert.equal(pickTier('dzięki!'), 'main');
  assert.equal(pickTier('dzięki!', { lightEnabled: true }), 'light');
  assert.equal(pickTier('Sprawdź to ogłoszenie', { lightEnabled: true }), 'main');
  assert.equal(pickTier('x'.repeat(200), { lightEnabled: true }), 'main');
});
