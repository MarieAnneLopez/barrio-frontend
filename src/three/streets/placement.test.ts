import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { makePuntos, makeSuelo, makeVias } from './fixtures';
import { writePose } from './instances';
import { LAMP_STEP, lampPoses } from './lamps';
import { buildNetwork, wayTags } from './network';
import { roadSpec } from './roadClass';
import { SegmentIndex } from './segmentIndex';
import { signalPoses } from './signals';
import { ROW_STEP, treePoses } from './trees';

const C = TNT3.clasesVia;
// Avenida de 400 m hacia el este con un cruce en x = 200 y una calle residencial al norte.
const vias = makeVias([[0, 0], [200, 0], [400, 0], [200, -150]], [
  { nodes: [0, 1, 2], clase: C.secondary, sentido: 1 },
  { nodes: [1, 3], clase: C.residential },
]);
const net = buildNetwork(vias);
const avenue = roadSpec(wayTags(vias, 0));
const tip = (yaw: number, x: number, z: number, arm: number) => [x + Math.cos(yaw) * arm, z - Math.sin(yaw) * arm];

describe('faroles decorativos (OSM no registra faroles: D105)', () => {
  const lamps = lampPoses(vias, net);

  it('solo en las vías principales, cada ~35 m, alternando lados, en el andén y con el brazo hacia la vía', () => {
    expect(lamps.length).toBeGreaterThan(6);
    expect(lamps.every((l) => Math.abs(l.z) > avenue.half && Math.abs(l.z) < avenue.half + avenue.sidewalk)).toBe(true);
    const xs = lamps.map((l) => l.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) expect((xs[i] ?? 0) - (xs[i - 1] ?? 0)).toBeGreaterThanOrEqual(LAMP_STEP - 1e-3);
    const sides = lamps.map((l) => Math.sign(l.z));
    expect(new Set(sides)).toEqual(new Set([-1, 1]));
    for (const l of lamps) expect(Math.abs(tip(l.yaw, l.x, l.z, 1.6)[1] ?? 0)).toBeLessThan(Math.abs(l.z));
  });

  it('ninguno dentro del cruce', () => {
    expect(lamps.every((l) => Math.abs(l.x - 200) > avenue.half + 4)).toBe(true);
  });
});

describe('semáforos de OSM a ambos lados de su calzada', () => {
  const withSignal = { ...vias, semaforos: { xz: Float32Array.from([100, 1]), osm: new Float64Array(1) } };
  const poses = signalPoses(withSignal, new SegmentIndex(withSignal, net));

  it('dos postes enfrentados fuera de la calzada, con el brazo sobre ella', () => {
    expect(poses).toHaveLength(2);
    expect(poses.map((p) => Math.sign(p.z)).sort()).toEqual([-1, 1]);
    for (const p of poses) {
      expect(Math.abs(p.z)).toBeGreaterThan(avenue.half);
      expect(Math.abs(tip(p.yaw, p.x, p.z, 3)[1] ?? 0)).toBeLessThan(avenue.half);
    }
  });
});

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
    const park = [0, 0, 200, 0, 200, 200, 0, 200];
    const trees = treePoses(makePuntos([]), makeSuelo([[TNT3.clasesSuelo.park, [park]]]));
    expect(trees.length).toBeGreaterThan(20);
    expect(trees.every((t) => t.decorative && t.x > 0 && t.x < 200 && t.z > 0 && t.z < 200)).toBe(true);
  });
});

describe('matrices de instancia', () => {
  it('writePose da lo mismo que Matrix4.compose con giro (y) y balanceo (x)', () => {
    const out = new Float32Array(32);
    writePose(out, 1, 3, 4, 5, 0.7, 2, 3, 4, 0.2);
    const q = new Quaternion().setFromEuler(new Euler(0.2, 0.7, 0, 'YXZ'));
    const m = new Matrix4().compose(new Vector3(3, 4, 5), q, new Vector3(2, 3, 4));
    m.elements.forEach((v, i) => expect(out[16 + i]).toBeCloseTo(v, 5));
  });
});
