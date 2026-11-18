import type { BuildingSource } from './protocol';
import type { Volume } from './volume';

// Medianeras: en El Tintal la mitad del largo de los muros (50,8 %, medido en los datos) es un tramo
// que dos edificios vecinos comparten exactamente, en sentidos opuestos (casas en hilera). De cada
// par se dibuja un solo muro, sin ventanas (culata): así no hay dos caras en el mismo plano
// peleando por la profundidad, y el muro que queda dentro del vecino no se dibuja.

/** Tipo de cada tramo de anillo (índice = su vértice de arranque). */
export const FACADE = 0;
export const BLIND = 1;
export const DROPPED = 2;

/** Tramos por tanda: el respaldo en el hilo principal cede el control entre tandas. */
const STEP = 8192;

/** Clave entera de un punto: los decímetros de TNT3 (±3276,7 m) en 16 bits por eje. */
const pointKey = (xz: ArrayLike<number>, v: number) =>
  (Math.round((xz[2 * v] ?? 0) * 10) + 32_768) * 65_536 + (Math.round((xz[2 * v + 1] ?? 0) * 10) + 32_768);

/** Qué hacer con el muro de `a` que mira hacia `b` (y que `b` repite en sentido contrario). */
function decide(va: Volume, vb: Volume, a: number, b: number): number {
  if (va.bottom === vb.bottom && va.top === vb.top) return a < b ? BLIND : DROPPED;
  const covered = vb.bottom <= va.bottom && va.top <= vb.top; // queda entero dentro del vecino
  return covered ? DROPPED : BLIND;
}

/** Tipo de cada tramo (FACADE, BLIND o DROPPED) de los edificios con volumen; cede cada STEP tramos. */
export function* wallKinds(s: BuildingSource, volumes: ReadonlyArray<Volume | null>): Generator<void, Uint8Array> {
  const total = s.anillos[s.anillos.length - 1] ?? 0;
  const owner = new Int32Array(total).fill(-1);
  const end = new Int32Array(total);
  const keys = new Float64Array(total);
  for (let b = 0; b < s.count; b++) {
    if (!volumes[b]) continue;
    for (let r = s.edificios[b] ?? 0; r < (s.edificios[b + 1] ?? 0); r++) {
      const [from, to] = [s.anillos[r] ?? 0, s.anillos[r + 1] ?? 0];
      for (let v = from; v < to; v++) [owner[v], end[v], keys[v]] = [b, v + 1 < to ? v + 1 : from, pointKey(s.xz, v)];
    }
  }
  yield;
  // Lista enlazada de tramos por punto de arranque (sin un arreglo por punto).
  const head = new Map<number, number>();
  const chain = new Int32Array(total).fill(-1);
  for (let v = 0; v < total; v++) {
    if ((owner[v] ?? -1) < 0) continue;
    const key = keys[v] ?? 0;
    chain[v] = head.get(key) ?? -1;
    head.set(key, v);
  }
  const kinds = new Uint8Array(total);
  for (let v = 0; v < total; v++) {
    if (v % STEP === 0) yield;
    const a = owner[v] ?? -1;
    if (a < 0) continue;
    for (let u = head.get(keys[end[v] ?? 0] ?? 0) ?? -1; u >= 0; u = chain[u] ?? -1) {
      const b = owner[u] ?? -1;
      if (b === a || keys[end[u] ?? 0] !== keys[v]) continue; // otro edificio, mismo tramo al revés
      const [va, vb] = [volumes[a], volumes[b]];
      if (va && vb) kinds[v] = decide(va, vb, a, b);
      break;
    }
  }
  return kinds;
}
