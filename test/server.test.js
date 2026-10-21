import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestError, RateLimitError, AuthenticationError } from '@anthropic-ai/sdk';
import { handleChat, validate, describeError, LIMITS } from '../server/chat.js';

const post = (body, headers = {}) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

test('bez hasła na produkcji: 500 z czytelną informacją', async () => {
  const res = await handleChat(post({ ping: true }), { ANTHROPIC_API_KEY: 'x' });
  assert.equal(res.status, 500);
  assert.equal((await res.json()).kind, 'config');
});

test('złe hasło: 401, dobre hasło: ping OK (bez wołania modelu)', async () => {
  const env = { CHLEB_ACCESS_TOKEN: 'sekret-123', ANTHROPIC_API_KEY: 'x' };
  assert.equal((await handleChat(post({ ping: true }, { 'x-chleb-token': 'zle' }), env)).status, 401);
  const ok = await handleChat(post({ ping: true }, { 'x-chleb-token': 'sekret-123' }), env);
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.equal(data.ok, true);
  assert.equal(data.models.main, 'claude-sonnet-5');
});

test('dev bez hasła przepuszcza, ale bez klucza zwraca config', async () => {
  const res = await handleChat(post({ messages: [{ role: 'user', content: 'hej' }] }), { CHLEB_DEV: '1' });
  assert.equal(res.status, 500);
  assert.match((await res.json()).message, /ANTHROPIC_API_KEY/);
});

test('validate: stała postać treści (cache), cache_control tylko na oznaczonym bloku', () => {
  const r = validate({
    system: [{ text: 'persona' }, { text: 'receptura', cache: true }],
    messages: [
      { role: 'user', content: [{ type: 'text', text: 'kontekst' }, { type: 'text', text: 'pytanie' }] },
      { role: 'assistant', content: 'odpowiedź' },
      { role: 'user', content: 'dalej' },
    ],
  });
  assert.equal(r.tier, 'main');
  assert.deepEqual(r.system[0], { type: 'text', text: 'persona' });
  assert.deepEqual(r.system[1].cache_control, { type: 'ephemeral' });
  assert.deepEqual(r.messages[1].content, [{ type: 'text', text: 'odpowiedź' }]);
  assert.equal(r.messages[0].content.length, 2);
});

test('validate: odrzuca złe i zbyt duże zapytania', () => {
  assert.ok(validate({ messages: [] }).error);
  assert.ok(validate({ messages: [{ role: 'assistant', content: 'x' }] }).error);
  assert.ok(validate({ messages: [{ role: 'system', content: 'x' }] }).error);
  assert.ok(validate({ messages: Array.from({ length: LIMITS.messages + 1 }, () => ({ role: 'user', content: 'x' })) }).error);
  assert.ok(validate({ messages: [{ role: 'user', content: 'x'.repeat(LIMITS.chars + 1) }] }).error);
  assert.equal(validate({ tier: 'light', messages: [{ role: 'user', content: 'x' }] }).tier, 'light');
  assert.equal(validate({ tier: 'opus-drogi', messages: [{ role: 'user', content: 'x' }] }).tier, 'main');
});

test('describeError: limit wydatków, limit poziomu, klucz', () => {
  const body = (type, message, details) => ({ type: 'error', error: { type, message, ...(details ? { details } : {}) } });
  const own = new BadRequestError(400, body('invalid_request_error', 'You have reached your specified API usage limits. You will regain access on 2026-10-01 at 00:00 UTC.'), undefined, new Headers(), 'invalid_request_error');
  assert.equal(describeError(own).kind, 'limit');
  const tierCap = new RateLimitError(429, body('rate_limit_error', 'You have reached your API usage limits', { error_code: 'enforced_spend_limit_reached' }), undefined, new Headers(), 'rate_limit_error');
  assert.equal(describeError(tierCap).kind, 'limit');
  const rate = new RateLimitError(429, body('rate_limit_error', 'Too many requests'), undefined, new Headers(), 'rate_limit_error');
  assert.equal(describeError(rate).kind, 'rate');
  const auth = new AuthenticationError(401, body('authentication_error', 'invalid x-api-key'), undefined, new Headers(), 'authentication_error');
  assert.equal(describeError(auth).kind, 'auth');
});
