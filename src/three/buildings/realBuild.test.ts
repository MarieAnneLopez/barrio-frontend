// @vitest-environment node
// Los 20 394 edificios reales (public/data/tintal, D105) se construyen completos: cada edificio con
// volumen en una sola tesela, índices válidos y el tiempo de construcción medido (informe).
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { decodeEdificios } from '../data/decode';
import type { Edificios, TintalManifest } from '../data/format';
import { gunzip } from '../data/gunzip';
import { buildAll, buildTiles } from './builder';
import { sourceOf, type BuildResult } from './protocol';
import { SLICE_MS } from './useBuildingTiles';

vi.mock('@react-three/fiber', () => ({ useFrame: () => undefined }));

const dir = new URL('../../../public/data/tintal/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8')) as TintalManifest;
let e: Edificios;
let result: BuildResult;

beforeAll(async () => {
  e = decodeEdificios(await gunzip(new Uint8Array(readFileSync(new URL('edificios.bin.gz', dir)))));
  // En frío (como el worker recién creado) y en caliente (JIT ya optimizado).
  const cold = buildAll(sourceOf(e)).stats.ms;
  result = buildAll(sourceOf(e));
  console.info('[edificios] construcción con datos reales:', JSON.stringify({ ...result.stats, msEnFrio: cold }));
});

describe('edificios reales de El Tintal', () => {
  it('dibuja todos menos las subterráneas, cada uno en una sola tesela', () => {
    const seen = new Uint8Array(e.count);
    for (const t of result.tiles) for (const b of t.buildings) seen[b] = (seen[b] ?? 0) + 1;
    const drawn = seen.reduce((n, v) => n + (v === 1 ? 1 : 0), 0);
    expect(seen.every((v) => v <= 1)).toBe(true);
    expect(drawn).toBe(manifest.conteos.edificios.total - manifest.conteos.edificios.subterraneas);
    expect(result.stats.buildings).toBe(drawn);
  });

  it('índices dentro de cada tesela, sin teselas vacías, de 16 bits cuando caben', () => {
    for (const t of result.tiles) {
      const vertices = t.position.length / 3;
      expect(t.buildings.length).toBeGreaterThan(0);
      let max = 0;
      for (const v of t.index) max = Math.max(max, v);
      expect(max).toBeLessThan(vertices);
      expect(t.index instanceof Uint16Array).toBe(vertices <= 65_536);
    }
    expect(result.stats.tiles).toBeLessThan(100);
  });

  it('presupuesto: menos de 600 000 triángulos y construcción en menos de 1 s (mide ~0,1 s)', () => {
    expect(result.stats.triangles).toBeLessThan(600_000);
    // Tope holgado para una máquina cargada (dos procesos de prueba a la vez), pero que detecta
    // una regresión de 10×: con los datos reales tarda 80-110 ms en caliente y 130-145 ms en frío.
    expect(result.stats.ms).toBeLessThan(1000);
  });

  it('respaldo en tandas: ningún paso del constructor dura más que una tanda (reloj real)', () => {
    const longest = () => {
      const steps = buildTiles(sourceOf(e));
      let max = 0;
      for (;;) {
        const t0 = performance.now();
        const step = steps.next();
        max = Math.max(max, performance.now() - t0);
        if (step.done) return max;
      }
    };
    // El mejor de dos recorridos: una pausa del recolector no es un paso largo del constructor.
    const best = Math.min(longest(), longest());
    console.info('[edificios] paso más largo del respaldo en tandas (ms):', best.toFixed(2));
    expect(best).toBeLessThan(SLICE_MS);
  });
});
