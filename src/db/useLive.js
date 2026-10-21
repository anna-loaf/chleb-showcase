import { useEffect, useState } from 'react';
import { onChange } from './db.js';

// Wynik zapytania do IndexedDB, odświeżany po zmianach w podanych magazynach.
export function useLive(query, stores, deps = []) {
  const [value, setValue] = useState(undefined);
  useEffect(() => {
    let alive = true;
    const run = () => query().then((v) => alive && setValue(v));
    run();
    const off = onChange((changedStores) => {
      if (changedStores.some((s) => stores.includes(s))) run();
    });
    return () => {
      alive = false;
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}
