import { db, changed } from '../db/db.js';
import { BUDGET } from '../config.js';
import { DEFAULT_KNOWLEDGE } from '../lib/prompt.js';

export const DEFAULTS = {
  knowledge: DEFAULT_KNOWLEDGE,
  token: '',
  budget: { monthlyPln: BUDGET.monthlyPln, usdPln: BUDGET.usdPln, vatPercent: BUDGET.vatPercent },
  lightModel: false,
  chatWindowStart: 0,
  lastWelcome: '',
  installHintHidden: false,
  pushSubscription: '',
};

export async function getSettings() {
  const d = await db();
  const keys = await d.getAllKeys('settings');
  const values = await d.getAll('settings');
  const stored = Object.fromEntries(keys.map((k, i) => [k, values[i]]));
  return {
    ...DEFAULTS,
    ...stored,
    knowledge: { ...DEFAULTS.knowledge, ...stored.knowledge },
    budget: { ...DEFAULTS.budget, ...stored.budget },
  };
}

export async function setSetting(key, value) {
  await (await db()).put('settings', value, key);
  changed('settings');
}
