import { Color } from 'three';
import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { DECK, pushBridges } from './bridgeParts';
import { makeSuelo, makeVias } from './fixtures';
import { LEVEL } from './levels';
import { pushFootways, pushWaterLines } from './pathways';
import { Sink, type DayNight } from './sink';
import { BRIDGE_HEIGHT } from './wayLine';

const C = TNT3.clasesVia;
const B = TNT3.banderasVia;
const gray = (v: number): DayNight => ({ day: new Color(v, v, v), night: new Color(v, v, v) });
const palette = { anden: gray(0.1), ciclo: gray(0.2), tierra: gray(0.3) };
const ys = (sink: Sink) => new Set(sink.position.filter((_, i) => i % 3 === 1).map((y) => y.toFixed(2)));

describe('senderos, plazas y agua en la malla del suelo', () => {
  const vias = makeVias([[0, 0], [50, 0], [50, 50], [0, 50], [100, 0]], [
    { nodes: [0, 1, 4], clase: C.footway },
    { nodes: [0, 1, 2, 3, 0], clase: C.pedestrian, banderas: B.area },
    { nodes: [3, 2], clase: C.cycleway, banderas: B.tunel },
    { nodes: [1, 4], clase: C.residential },
  ]);

  it('cada sendero es una cinta de 2 triángulos por tramo; los túneles y las calzadas no van aquí', () => {
    const sink = new Sink();
    const triangles = pushFootways(sink, vias, palette);
    // 4 del sendero (2 tramos) + 2 de la plaza cuadrada.
    expect(triangles).toBe(6);
    expect(ys(sink)).toEqual(new Set([LEVEL.foot.toFixed(2), LEVEL.plaza.toFixed(2)]));
  });

  it('las líneas de agua van como cintas a la altura de los canales', () => {
    const suelo = makeSuelo([]);
    suelo.lineas = {
      count: 1, xz: Float32Array.from([0, 0, 100, 0, 100, 100]), inicios: Uint32Array.from([0, 3]),
      clase: Uint8Array.from([TNT3.clasesAgua.canal]), nombre: new Uint32Array(1), osm: new Float64Array(1),
    };
    const sink = new Sink();
    expect(pushWaterLines(sink, suelo, gray(0.5))).toBe(4);
    expect(ys(sink)).toEqual(new Set([LEVEL.canal.toFixed(2)]));
  });
});

describe('estructura de los puentes', () => {
  const bridge = makeVias([[0, 0], [200, 0]], [{ nodes: [0, 1], clase: C.footway, banderas: B.puente, nivel: 1 }]);

  it('costados verticales bajo el tablero y pilas solo donde el puente va alto', () => {
    const sink = new Sink();
    expect(pushBridges(sink, bridge, gray(0.4))).toBeGreaterThan(0);
    const top = Math.max(...sink.position.filter((_, i) => i % 3 === 1));
    expect(top).toBeCloseTo(BRIDGE_HEIGHT + LEVEL.foot);
    const bottoms = sink.position.filter((_, i) => i % 3 === 1 && sink.position[i] !== undefined);
    expect(Math.min(...bottoms)).toBe(0); // las pilas llegan al suelo
    // Ninguna pila pasa por encima del tablero.
    const pillarTops = sink.position.filter((y, i) => i % 3 === 1 && y > BRIDGE_HEIGHT - DECK + LEVEL.foot + 1e-3);
    expect(pillarTops.every((y) => y <= BRIDGE_HEIGHT + LEVEL.foot + 1e-3)).toBe(true);
  });

  it('una vía sin puente no agrega estructura', () => {
    const sink = new Sink();
    expect(pushBridges(sink, makeVias([[0, 0], [9, 0]], [{ nodes: [0, 1], clase: C.footway }]), gray(0.4))).toBe(0);
  });
});
