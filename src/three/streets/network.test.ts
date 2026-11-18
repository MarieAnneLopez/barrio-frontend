import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makeVias } from './fixtures';
import { buildNetwork, clearance, isJunction, junctionRadius, wayTags } from './network';
import { roadSpec } from './roadClass';
import { BRIDGE_HEIGHT, wayLine } from './wayLine';

const C = TNT3.clasesVia;
// Cruce en (0, 0): una avenida de un sentido de oeste a este y dos calles que llegan del norte y del sur.
const NODES: Array<[number, number]> = [[0, 0], [-100, 0], [100, 0], [0, -100], [0, 100], [200, 0]];
const vias = makeVias(NODES, [
  { nodes: [1, 0, 2], clase: C.primary, sentido: 1 },
  { nodes: [3, 0], clase: C.residential },
  { nodes: [0, 4], clase: C.residential },
  { nodes: [2, 5], clase: C.residential },
  { nodes: [3, 1], clase: C.footway },
]);

describe('red vial: cruces por nodos compartidos', () => {
  const net = buildNetwork(vias);

  it('cuenta los extremos de calzada en cada nodo (pasar por el medio vale 2) e ignora las peatonales', () => {
    expect(net.usage[0]).toBe(4);
    expect(net.usage[2]).toBe(2);
    expect(net.usage[1]).toBe(1);
    expect(isJunction(net, 0)).toBe(true);
    expect(isJunction(net, 2)).toBe(false);
  });

  it('las marcas de una calle se apartan del cruce lo que mide la mitad de la vía de igual o mayor rango', () => {
    const avenue = roadSpec(wayTags(vias, 0)).half;
    expect(clearance(net, 0, 1)).toBeCloseTo(avenue);
    expect(clearance(net, 0, 0)).toBe(0); // la avenida pasa por encima: sus marcas siguen
    expect(clearance(net, 2, 3)).toBe(0); // continuación, no cruce
    expect(junctionRadius(net, 0)).toBeCloseTo(avenue);
    expect(junctionRadius(net, 2)).toBe(0);
  });
});

describe('línea de cada tramo con su altura', () => {
  it('a ras de suelo las vías normales, con los nodos de origen', () => {
    const line = wayLine(vias, 0);
    expect(Array.from(line.node)).toEqual([1, 0, 2]);
    expect(Array.from(line.y)).toEqual([0, 0, 0]);
    expect(line.cum[2]).toBeCloseTo(200);
  });

  it('un puente sube por rampas hasta su altura y baja donde toca el suelo', () => {
    const bridged = makeVias([[0, 0], [200, 0], [300, 0]], [
      { nodes: [0, 1], clase: C.footway, banderas: TNT3.banderasVia.puente, nivel: 1 },
      { nodes: [1, 2], clase: C.footway, banderas: TNT3.banderasVia.puente, nivel: 1 },
    ]);
    const first = wayLine(bridged, 0);
    expect(first.y[0]).toBe(0); // arranca en el suelo
    expect(Math.max(...first.y)).toBeCloseTo(BRIDGE_HEIGHT);
    expect(first.y[first.y.length - 1]).toBeCloseTo(BRIDGE_HEIGHT); // sigue en otro puente: no baja
    expect(Array.from(first.node).filter((n) => n >= 0)).toEqual([0, 1]);
    const second = wayLine(bridged, 1);
    expect(second.y[0]).toBeCloseTo(BRIDGE_HEIGHT);
    expect(second.y[second.y.length - 1]).toBe(0);
  });
});
