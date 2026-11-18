// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { realEdificios, realPuntos, realSuelo, realVias } from '../../test/tintalReal';
import { TNT3 } from '../data/format';
import { makeEdificios, makePuntos, makeSuelo, makeVias } from './fixtures';
import { groundKind } from './groundAreas';
import { buildNetwork } from './network';
import { PolygonGrid } from './polygonGrid';
import { decorBlocker, TREE_GAP } from './treeGround';
import { ROW_STEP, treePoses, type TreePose } from './trees';

const S = TNT3.clasesSuelo;
const C = TNT3.clasesVia;
const rect = (x0: number, z0: number, x1: number, z1: number) => [x0, z0, x1, z0, x1, z1, x0, z1];

describe('árboles', () => {
  it('los reales de OSM en su punto y las hileras repartidas cada ROW_STEP m, con variedad fija', () => {
    const puntos = makePuntos([10, 20, -30, 5], [[0, 100, 70, 100]]);
    const trees = treePoses(puntos, makeSuelo([]));
    expect(trees.slice(0, 2).map((t) => [t.x, t.z])).toEqual([[10, 20], [-30, 5]]);
    expect(trees.length).toBe(2 + Math.floor(70 / ROW_STEP));
    expect(new Set(trees.map((t) => t.scale)).size).toBeGreaterThan(1);
    expect(treePoses(puntos, makeSuelo([]))).toEqual(trees);
  });

  it('en los parques agrega árboles decorativos (regla de dibujo) solo dentro del polígono', () => {
    const trees = treePoses(makePuntos([]), makeSuelo([[S.park, [rect(0, 0, 200, 200)]]]));
    expect(trees.length).toBeGreaterThan(20);
    expect(trees.every((t) => t.decorative && t.x > 0 && t.x < 200 && t.z > 0 && t.z < 200)).toBe(true);
  });
});

describe('los decorativos no caen sobre lo que dibuja un dato real', () => {
  // Parque con una cancha, unos juegos y agua; una calle residencial (z = 110), un sendero (x = 20) y
  // un edificio.
  const [pitch, play, water, house] = [rect(40, 40, 100, 100), rect(120, 120, 150, 150), rect(10, 160, 60, 190), rect(130, 20, 170, 60)];
  const world = {
    suelo: makeSuelo([[S.park, [rect(0, 0, 200, 200)]], [S.pitch, [pitch]], [S.playground, [play]], [S.water, [water]]]),
    vias: makeVias([[-10, 110], [210, 110], [20, -10], [20, 210]], [{ nodes: [0, 1], clase: C.residential }, { nodes: [2, 3], clase: C.footway }]),
    edificios: makeEdificios([[house]]),
  };
  const inside = (t: TreePose, r: number[]) => t.x > (r[0] ?? 0) && t.x < (r[4] ?? 0) && t.z > (r[1] ?? 0) && t.z < (r[5] ?? 0);

  it('ni en canchas, juegos, pistas o agua, ni sobre calzadas, andenes o senderos, ni dentro de edificios', () => {
    expect(treePoses(makePuntos([]), world.suelo).some((t) => inside(t, pitch))).toBe(true); // sin regla, sí
    const trees = treePoses(makePuntos([]), world.suelo, decorBlocker(world, buildNetwork(world.vias)));
    expect(trees.length).toBeGreaterThan(20);
    for (const area of [pitch, play, water, house]) expect(trees.filter((t) => inside(t, area))).toEqual([]);
    expect(trees.filter((t) => Math.abs(t.z - 110) < 3 + 2 + TREE_GAP)).toEqual([]); // media calzada + andén
    expect(trees.filter((t) => Math.abs(t.x - 20) < 1 + TREE_GAP)).toEqual([]); // medio sendero
  });

  it('con los datos reales: ningún decorativo en un área dura, en un edificio ni sobre una vía', async () => {
    const [vias, suelo, edificios, puntos] = await Promise.all([realVias(), realSuelo(), realEdificios(), realPuntos()]);
    const real = { vias, suelo, edificios };
    const blocked = decorBlocker(real, buildNetwork(vias));
    const decorative = treePoses(puntos, suelo, blocked).filter((t) => t.decorative);
    expect(decorative.length).toBeGreaterThan(800);
    expect(decorative.filter((t) => blocked(t.x, t.z))).toEqual([]);
    const hard = new PolygonGrid(suelo.xz, suelo.anillos, suelo.areas, suelo.count, (a) => groundKind(suelo.clase[a] ?? 0) !== 'verde' && a > 0);
    expect(decorative.filter((t) => hard.contains(t.x, t.z))).toEqual([]);
  });
});
