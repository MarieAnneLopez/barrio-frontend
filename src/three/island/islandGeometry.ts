import { BufferGeometry, Color, Float32BufferAttribute } from 'three';

// La isla sobre la que flota el barrio (gran actualización): las paredes bajan desde el borde del
// barrio (y = 0) en anillos que se encogen hacia el centro hasta cerrar en una punta de roca.
// Solo las paredes: el suelo del barrio lo dibuja la capa de calles encima, en y = 0.

/** [altura en m, escala hacia el centro, ¿tierra?]: banda de tierra arriba y roca que se afina. */
export const ISLAND_RINGS: ReadonlyArray<readonly [number, number, boolean]> = [
  [0, 1, true],
  [-7, 1, true],
  [-34, 0.93, false],
  [-95, 0.76, false],
  [-175, 0.48, false],
  [-245, 0.2, false],
];
export const ISLAND_TIP = -290;
const MAX_POINTS = 220;

/** Ruido fijo por vértice (sin azar: la isla es igual en cada visita). */
const jitter = (i: number, ring: number) => {
  const v = Math.sin(i * 12.9898 + ring * 78.233) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
};

/** Reduce el anillo del borde a lo sumo a MAX_POINTS vértices, tomando uno de cada k. */
export function simplifyRing(xz: ArrayLike<number>): number[] {
  const count = Math.floor(xz.length / 2);
  const step = Math.max(1, Math.ceil(count / MAX_POINTS));
  const out: number[] = [];
  for (let i = 0; i < count; i += step) out.push(xz[i * 2] ?? 0, xz[i * 2 + 1] ?? 0);
  return out;
}

/**
 * Paredes de la isla bajo el anillo `xz` ([x0, z0, x1, z1, …], abierto), con color por vértice:
 * `earth` en la banda de arriba y `rock` abajo. Geometría sin índice para sombreado plano.
 */
export function islandGeometry(xz: ArrayLike<number>, earth: Color, rock: Color): BufferGeometry {
  const ring = simplifyRing(xz);
  const n = ring.length / 2;
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < n; i++) {
    cx += ring[i * 2] ?? 0;
    cz += ring[i * 2 + 1] ?? 0;
  }
  cx /= n || 1;
  cz /= n || 1;
  const at = (r: number, i: number): [number, number, number] => {
    const [y, scale] = ISLAND_RINGS[r] ?? [ISLAND_TIP, 0];
    const k = r < 2 ? scale : scale * (1 + 0.06 * jitter(i, r));
    const x = ring[(i % n) * 2] ?? cx;
    const z = ring[(i % n) * 2 + 1] ?? cz;
    return [cx + (x - cx) * k, y, cz + (z - cz) * k];
  };
  const positions: number[] = [];
  const colors: number[] = [];
  const push = (p: [number, number, number], c: Color) => {
    positions.push(...p);
    colors.push(c.r, c.g, c.b);
  };
  for (let r = 0; r < ISLAND_RINGS.length; r++) {
    const last = r === ISLAND_RINGS.length - 1;
    const tone = ISLAND_RINGS[r]?.[2] ? earth : rock;
    for (let i = 0; i < n; i++) {
      const [a, b] = [at(r, i), at(r, i + 1)];
      if (last) {
        // cierre en punta
        push(a, tone);
        push([cx, ISLAND_TIP, cz], tone);
        push(b, tone);
        continue;
      }
      const [c, d] = [at(r + 1, i), at(r + 1, i + 1)];
      for (const p of [a, c, b, b, c, d]) push(p, tone);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
