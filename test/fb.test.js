import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapPost, isRecent } from '../scripts/fb.mjs';
import { FB_GROUPS, postsPerScan, gapBefore, SCAN_HOURS_UTC } from '../shared/fb-groups.js';

test('FB: mapowanie pól AnyAPI (publishTime w sekundach)', () => {
  const p = mapPost({ text: 'Casting', url: 'u', publishTime: 1791729692 }, 'Grupa');
  assert.equal(p.group, 'Grupa');
  assert.equal(p.time, new Date(1791729692 * 1000).toISOString());
  assert.equal(mapPost({ message: 'x', postUrl: 'v', createdAt: '2026-10-10T10:00:00Z' }).url, 'v');
});

test('FB: okno świeżości 13 h', () => {
  const now = Date.parse('2026-10-11T12:00:00Z');
  assert.equal(isRecent({ time: '2026-10-11T00:00:00Z' }, now), true);
  assert.equal(isRecent({ time: '2026-10-10T20:00:00Z' }, now), false);
  assert.equal(isRecent({ time: '' }, now), true);
});

test('FB: przerwy między skanami i limit kosztu', () => {
  assert.deepEqual(SCAN_HOURS_UTC.map(gapBefore), [12, 5, 7]);
  assert.equal(postsPerScan({ perMonth: 12 }, 5), 3);
  assert.ok(postsPerScan({ perMonth: 264 }, 12) > postsPerScan({ perMonth: 264 }, 5));
  const perDay = SCAN_HOURS_UTC.reduce((s, h) => s + FB_GROUPS.reduce((a, g) => a + postsPerScan(g, gapBefore(h)), 0), 0);
  const usd = perDay * 30 * 0.0009;
  assert.ok(usd < 4.5, `ok. ${perDay * 30} postów/mies. ≈ ${usd.toFixed(2)} — ma zostać zapas w darmowych $5 Apify`);
});
