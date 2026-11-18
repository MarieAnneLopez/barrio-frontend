import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Tintal3D } from '../data/format';
import { buildTiles } from './builder';
import { buildInWorker } from './buildingsClient';
import { sourceOf, type BuildResult } from './protocol';

/** Presupuesto por cuadro del respaldo en el hilo principal (ms): tandas cortas, sin tareas largas. */
export const SLICE_MS = 6;

type Steps = Generator<void, BuildResult>;

/** Avanza el constructor hasta terminar o hasta `until` (reloj `now`); devuelve el resultado al final. */
export function advance(steps: Steps, until: number, now: () => number = () => performance.now()): BuildResult | null {
  do {
    const step = steps.next();
    if (step.done) return step.value;
  } while (now() < until);
  return null;
}

/**
 * Teselas de los edificios de `world`: las arma el Web Worker propio y, si no se puede (sin
 * Worker, error o tiempo agotado), el mismo constructor en tandas de SLICE_MS por cuadro (useFrame,
 * sin bucles de animación propios). null mientras tanto.
 */
export function useBuildingTiles(world: Tintal3D): BuildResult | null {
  const [built, setBuilt] = useState<{ world: Tintal3D; result: BuildResult } | null>(null);
  const fallback = useRef<Steps | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    const source = sourceOf(world.edificios);
    buildInWorker(source, { signal: abort.signal }).then(
      (result) => setBuilt({ world, result }),
      () => {
        if (!abort.signal.aborted) fallback.current = buildTiles(source);
      },
    );
    return () => {
      abort.abort();
      fallback.current = null;
    };
  }, [world]);

  useFrame(() => {
    const steps = fallback.current;
    if (!steps) return;
    const result = advance(steps, performance.now() + SLICE_MS);
    if (!result) return;
    fallback.current = null;
    setBuilt({ world, result });
  });

  return built?.world === world ? built.result : null;
}
