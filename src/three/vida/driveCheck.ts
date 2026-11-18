// Solo para pruebas (traffic.test, turns.test): corre la simulación del tráfico y cuenta lo que no
// debe pasar nunca.
import type { Vias } from '../data/format';
import { SegmentIndex } from '../streets/segmentIndex';
import type { LaneGraph } from './laneGraph';
import { createTraffic, stepTraffic, type Traffic } from './traffic';
import { edgePose } from './trafficPose';

/**
 * Con el grafo: sentido de la arista (wrongWay), carril a la derecha en doble sentido (leftSide), avance
 * siempre hacia adelante en su arista (backwards) y cada cambio de arista por una que sale del nodo
 * donde terminó la anterior (jumps). Con la GEOMETRÍA de la vía y no con las banderas del grafo: el
 * desplazamiento real entre dos pasos va con el sentido de una vía de un sentido (againstDrawing) y,
 * en doble sentido, por la derecha de quien avanza (leftOfTravel); `moved` cuenta esas comparaciones.
 * Las reapariciones (en una salida de la escena) no cuentan como movimiento.
 */
export function drive(v: Vias, g: LaneGraph, cars: number, steps: number, dt = 0.1) {
  const tr: Traffic = createTraffic(g, cars);
  const ways = new SegmentIndex(v, () => 1);
  const center = [0, 0, 0, 0, 0];
  const report = {
    wrongWay: 0, leftSide: 0, backwards: 0, jumps: 0, checked: 0, nan: 0, againstDrawing: 0, leftOfTravel: 0, moved: 0, respawns: 0, leftInside: 0,
  };
  for (let k = 0; k < steps; k++) {
    const before = Array.from({ length: cars }, (_, i) => [tr.edge[i] ?? 0, tr.s[i] ?? 0, tr.age[i] ?? 0, tr.x[i] ?? 0, tr.z[i] ?? 0, tr.turning[i] ?? 0] as const);
    stepTraffic(g, tr, cars, dt);
    for (let i = 0; i < cars; i++) {
      const [x, z] = [tr.x[i] ?? 0, tr.z[i] ?? 0];
      if (!Number.isFinite(x) || !Number.isFinite(z)) report.nan += 1;
      const [edge0, s0, age0, x0, z0, turning0] = before[i] ?? [0, 0, 0, 0, 0, 0];
      const respawned = (tr.age[i] ?? 0) < age0;
      if (respawned) report.respawns += 1;
      // Solo se sale de la escena en una punta recortada o sin gemela; donde cabe la vuelta en U, nunca.
      if (respawned && !g.border[edge0] && (g.reverse[edge0] ?? -1) >= 0) report.leftInside += 1;
      const e = tr.edge[i] ?? 0;
      if (!respawned && e !== edge0 && g.from[e] !== g.to[edge0]) report.jumps += 1;
      if (!respawned && e === edge0 && !tr.turning[i] && (tr.s[i] ?? 0) < s0 - 1e-4) report.backwards += 1;
      if (tr.turning[i]) continue;
      const way = g.way[e] ?? 0;
      const sentido = v.sentido[way] ?? 0;
      report.checked += 1;
      if ((sentido === 1 && !g.forward[e]) || (sentido === -1 && g.forward[e])) report.wrongWay += 1;
      edgePose(g, e, tr.s[i] ?? 0, 0, center);
      const side = (x - (center[0] ?? 0)) * -(center[4] ?? 0) + (z - (center[2] ?? 0)) * (center[3] ?? 0);
      if (sentido === 0 && side <= 0) report.leftSide += 1;
      const [dx, dz] = [x - x0, z - z0];
      if (respawned || e !== edge0 || turning0 || dx * dx + dz * dz < 1e-6) continue;
      const [mx, mz] = [(x + x0) / 2, (z + z0) / 2];
      const hit = ways.nearest(mx, mz, 15, (h) => h.way === way);
      if (!hit || hit.t <= 0 || hit.t >= 1) continue; // en un quiebre de la vía: ambiguo
      report.moved += 1;
      const travel = dx * hit.dx + dz * hit.dz; // > 0: a favor del dibujo
      const right = (mx - hit.x) * -hit.dz + (mz - hit.z) * hit.dx; // > 0: a la derecha del dibujo
      if (sentido !== 0 && travel * sentido <= 0) report.againstDrawing += 1;
      if (sentido === 0 && right * travel <= 0) report.leftOfTravel += 1;
    }
  }
  return { tr, report };
}
