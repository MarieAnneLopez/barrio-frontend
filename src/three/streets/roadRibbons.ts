import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from 'three';
import type { Vias } from '../data/format';
import { LEVEL, roadLevel } from './levels';
import { clearance, isJunction, type Network } from './network';
import { rightNormals } from './polyline';
import { isBridge, wayLine } from './wayLine';

// Calzadas y andenes como cintas con atributos para el shader (roadMaterials): `aRoad` = (distancia
// a lo largo, distancia al eje, media calzada, carriles) y `aMeta` = (marcas, brillo, distancia libre
// al cruce de atrás, al de adelante). Cada tramo se parte en sus cruces: dentro de un trozo esas
// distancias son lineales y el shader aparta las marcas y el brillo de los cruces.

export interface RoadBuffers { position: number[]; road: number[]; meta: number[]; index: number[] }

const empty = (): RoadBuffers => ({ position: [], road: [], meta: [], index: [] });

/** Bit de marcas para las vías de un sentido en contra del dibujo (las estelas de noche van al revés). */
export const REVERSE_BIT = 16;

export function buildRoads(v: Vias, net: Network): { asphalt: RoadBuffers; sidewalks: RoadBuffers } {
  const asphalt = empty();
  const sidewalks = empty();
  for (let w = 0; w < v.count; w++) {
    const spec = net.specs[w];
    if (!spec) continue;
    const line = wayLine(v, w);
    const nrm = rightNormals(line.xz);
    const n = line.y.length;
    const style = spec.style + ((v.sentido[w] ?? 0) < 0 ? REVERSE_BIT : 0);
    let start = 0;
    for (let k = 1; k < n; k++) {
      const node = line.node[k] ?? -1;
      if (k < n - 1 && !(node >= 0 && isJunction(net, node))) continue;
      const free = (i: number) => ((line.node[i] ?? -1) >= 0 ? clearance(net, line.node[i] ?? 0, w) : 0);
      const piece = { from: start, to: k, rFrom: free(start), rTo: free(k) };
      const meta = [style, spec.glow] as const;
      pushPiece(asphalt, line, nrm, piece, spec.half, spec.half, spec.lanes, meta, roadLevel(spec.rank));
      if (spec.sidewalk > 0 && !isBridge(v, w)) {
        pushPiece(sidewalks, line, nrm, piece, spec.half + spec.sidewalk, spec.half, spec.lanes, meta, LEVEL.sidewalk);
      }
      start = k;
    }
  }
  return { asphalt, sidewalks };
}

interface Piece { from: number; to: number; rFrom: number; rTo: number }
interface Line { xz: Float32Array; cum: Float32Array; y: Float32Array }

function pushPiece(
  out: RoadBuffers, line: Line, nrm: Float32Array, p: Piece, width: number, half: number, lanes: number,
  meta: readonly [number, number], level: number,
): void {
  const first = out.position.length / 3;
  const [s0, s1] = [line.cum[p.from] ?? 0, line.cum[p.to] ?? 0];
  for (let k = p.from; k <= p.to; k++) {
    const [x, z, s] = [line.xz[2 * k] ?? 0, line.xz[2 * k + 1] ?? 0, line.cum[k] ?? 0];
    const [nx, nz] = [(nrm[2 * k] ?? 0) * width, (nrm[2 * k + 1] ?? 0) * width];
    const y = (line.y[k] ?? 0) + level;
    for (const side of [-1, 1]) {
      out.position.push(x + side * nx, y, z + side * nz);
      out.road.push(s, side * width, half, lanes);
      out.meta.push(meta[0], meta[1], s - s0 - p.rFrom, s1 - s - p.rTo);
    }
  }
  for (let k = 0; k < p.to - p.from; k++) {
    const [l0, r0, l1, r1] = [first + 2 * k, first + 2 * k + 1, first + 2 * k + 2, first + 2 * k + 3];
    out.index.push(l0, r0, l1, r0, r1, l1);
  }
}

export function roadGeometry(b: RoadBuffers): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(b.position, 3));
  g.setAttribute('aRoad', new Float32BufferAttribute(b.road, 4));
  g.setAttribute('aMeta', new Float32BufferAttribute(b.meta, 4));
  g.setIndex(new Uint32BufferAttribute(b.index, 1));
  g.computeBoundingSphere();
  return g;
}
