import { describe, expect, it, vi } from 'vitest';
import { buildAll, buildTiles } from './builder';
import { fakeSource, square } from './fixture';
import { advance } from './useBuildingTiles';

vi.mock('@react-three/fiber', () => ({ useFrame: () => undefined }));

const source = fakeSource(Array.from({ length: 30 }, (_, i) => ({ rings: [square((i % 6) * 15, -Math.floor(i / 6) * 15, 10)], pisos: 1 + (i % 7) })));

describe('respaldo en tandas (hilo principal)', () => {
  it('cada tanda se corta al agotar su tiempo y la siguiente sigue donde iba', () => {
    let clock = 0;
    const now = () => (clock += 1); // cada consulta del reloj avanza 1 ms
    const steps = buildTiles(source);
    let slices = 0;
    let result = null;
    while (!result) {
      slices += 1;
      result = advance(steps, clock + 5, now);
    }
    expect(slices).toBeGreaterThan(3);
    const whole = buildAll(source);
    expect(result.stats).toEqual({ ...whole.stats, ms: result.stats.ms });
    expect(result.tiles.map((t) => Array.from(t.index))).toEqual(whole.tiles.map((t) => Array.from(t.index)));
  });

  it('con tiempo de sobra termina en una sola tanda', () => {
    expect(advance(buildTiles(source), Infinity)?.stats.buildings).toBe(30);
  });
});
