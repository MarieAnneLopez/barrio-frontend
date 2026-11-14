import { useCallback, useState } from 'react';
import { readPref, writePref } from '../lib/storage';

/** Booleano recordado en localStorage (p. ej. Sidebar contraído). */
export function usePersistentFlag(key: string, initial: boolean) {
  const [value, setValue] = useState(() => {
    const saved = readPref(key);
    return saved === null ? initial : saved === 'true';
  });

  const update = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? next(current) : next;
        writePref(key, String(resolved));
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
