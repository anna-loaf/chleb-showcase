// Licznik kosztów w apce — szacunek z pól `usage` zwracanych przez API.
// Źródło prawdy to konsola Anthropic; to jest bezpiecznik „na oko” w złotówkach.
import { priceFor } from '../../shared/models.js';

export function costUsd(model, usage = {}) {
  const p = priceFor(model);
  if (!p) return 0; // np. tryb próbny
  const write = usage.cache_creation_input_tokens ?? 0;
  const write1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const write5m = Math.max(0, write - write1h);
  return (
    ((usage.input_tokens ?? 0) * p.input +
      write5m * p.cacheWrite5m +
      write1h * p.cacheWrite1h +
      (usage.cache_read_input_tokens ?? 0) * p.cacheRead +
      (usage.output_tokens ?? 0) * p.output) /
    1_000_000
  );
}

export const usdToPln = (usd, { usdPln, vatPercent }) => usd * usdPln * (1 + vatPercent / 100);

export function addUsage(month, entry, model, usage) {
  const base = entry ?? { month, requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, usd: 0 };
  return {
    ...base,
    requests: base.requests + 1,
    input: base.input + (usage.input_tokens ?? 0),
    output: base.output + (usage.output_tokens ?? 0),
    cacheRead: base.cacheRead + (usage.cache_read_input_tokens ?? 0),
    cacheWrite: base.cacheWrite + (usage.cache_creation_input_tokens ?? 0),
    usd: base.usd + costUsd(model, usage),
  };
}

export const fmtPln = (pln) => `${pln.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
