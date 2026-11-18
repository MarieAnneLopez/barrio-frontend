import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { buildAll } from './builder';
import { fakeSource, square } from './fixture';
import { BLIND, DROPPED, FACADE, wallKinds } from './partyWalls';
import { faceVertices, triangleCount } from './tileProbe';
import { volumeOf } from './volume';

// Dos casas pegadas: A = cuadrado (0,0)-(10,-10) y B = (10,0)-(20,-10). El tramo 1 de A,
// (10,0)→(10,-10), y el tramo 3 de B, (10,-10)→(10,0), son la misma medianera en sentidos opuestos.
const pair = (pisosA: number, pisosB: number, baseB = 0) =>
  fakeSource([
    { rings: [square(0, 0, 10)], pisos: pisosA },
    { rings: [square(10, 0, 10)], pisos: pisosB, base: baseB, banderas: TNT3.banderasEdificio.pisosConocidos },
  ]);
const kindsOf = (s: ReturnType<typeof pair>) => {
  const steps = wallKinds(s, Array.from({ length: s.count }, (_, b) => volumeOf(s, b)));
  for (;;) {
    const step = steps.next();
    if (step.done) return Array.from(step.value);
  }
};

describe('medianeras (muros compartidos entre edificios vecinos)', () => {
  it('con la misma altura queda un solo muro, ciego, el del edificio de índice menor', () => {
    expect(kindsOf(pair(2, 2))).toEqual([FACADE, BLIND, FACADE, FACADE, FACADE, FACADE, FACADE, DROPPED]);
  });

  it('si el vecino es más alto, el muro del bajo (tapado) se omite y el del alto queda ciego', () => {
    expect(kindsOf(pair(2, 4))).toEqual([FACADE, DROPPED, FACADE, FACADE, FACADE, FACADE, FACADE, BLIND]);
    expect(kindsOf(pair(4, 2))).toEqual([FACADE, BLIND, FACADE, FACADE, FACADE, FACADE, FACADE, DROPPED]);
  });

  it('si ninguno cubre al otro (voladizo más alto que arranca arriba) quedan los dos, ciegos', () => {
    expect(kindsOf(pair(2, 3, 1))).toEqual([FACADE, BLIND, FACADE, FACADE, FACADE, FACADE, FACADE, BLIND]);
  });

  it('la geometría omite el muro tapado: 2 triángulos menos que dos casas sueltas', () => {
    const apart = fakeSource([{ rings: [square(0, 0, 10)], pisos: 2 }, { rings: [square(30, 0, 10)], pisos: 2 }]);
    const [glued, loose] = [buildAll(pair(2, 2)).tiles, buildAll(apart).tiles];
    const total = (tiles: typeof glued) => tiles.reduce((n, t) => n + triangleCount(t), 0);
    expect([total(loose), total(glued)]).toEqual([20, 18]);
  });

  it('el muro ciego (plano x = 10) es uno solo y no lleva columnas de ventanas (columna −1)', () => {
    const t = buildAll(pair(2, 2)).tiles[0];
    if (!t) throw new Error('sin tesela');
    const onPlane = Array.from({ length: triangleCount(t) }, (_, f) => faceVertices(t, f)).filter((vs) =>
      vs.every((v) => t.position[3 * v] === 10));
    expect(onPlane).toHaveLength(2);
    expect(new Set(onPlane.flat().map((v) => t.data[3 * v + 1]))).toEqual(new Set([-1]));
  });
});
