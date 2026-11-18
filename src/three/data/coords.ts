// Coordenadas TNT3: int16 en decímetros, la primera de cada secuencia absoluta y las demás como
// deltas que dan la vuelta en 16 bits. Sale Float32 en metros, listo para three.
import { FormatError } from './container';
import { TNT3, type F32 } from './format';

const wrap16 = (value: number) => (value << 16) >> 16;

/** `starts`: inicio de cada secuencia en vértices (el último valor es el total); sin él, una sola. */
export function decodeCoords(raw: Int16Array, starts?: ArrayLike<number>): F32 {
  const vertices = raw.length >> 1;
  const begins = starts ?? [0, vertices];
  if (begins.length === 0 || begins[0] !== 0 || begins[begins.length - 1] !== vertices) {
    throw new FormatError(`Los inicios de las secuencias no cubren los ${vertices} vértices`);
  }
  const out = new Float32Array(raw.length);
  for (let s = 0; s + 1 < begins.length; s++) {
    const from = begins[s] ?? 0;
    const to = begins[s + 1] ?? 0;
    if (to < from) throw new FormatError('Inicios de secuencia desordenados');
    let x = 0;
    let z = 0;
    for (let v = from; v < to; v++) {
      x = wrap16(x + (raw[2 * v] ?? 0));
      z = wrap16(z + (raw[2 * v + 1] ?? 0));
      out[2 * v] = x / TNT3.unidadesPorMetro;
      out[2 * v + 1] = z / TNT3.unidadesPorMetro;
    }
  }
  return out;
}

/** Ángulos (diezmilésimas de radián) o largos (decímetros) guardados en u16 → Float32. */
export function scaled(raw: Uint16Array, divisor: number): F32 {
  return Float32Array.from(raw, (v) => v / divisor);
}
