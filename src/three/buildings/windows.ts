// Ventanas de los edificios (shader): filas por piso y columnas cada ~3 m a lo largo de cada muro.
// De noche se encienden al azar con un hash entero por edificio, piso y columna, y cambian despacio
// con el reloj (uTime). Esta versión en TypeScript es el espejo exacto del GLSL de abajo (mismas
// constantes y operaciones de 32 bits) y es la que prueban las pruebas.

/** Separación entre columnas de ventanas a lo largo del muro (m reales, sin exagerar). */
export const WINDOW_SPACING = 3;
/** Fracción de ventanas encendidas en plena noche (decorativo: no es un dato). */
export const LIT_FRACTION = 0.42;
/** Cada ventana revisa si cambia cada PERIOD_MIN … PERIOD_MIN + PERIOD_SPAN segundos. */
export const PERIOD_MIN = 90;
export const PERIOD_SPAN = 150;
/** Separa piso y columna en una sola entrada del hash (columnas por edificio < 65 536). */
const ROW_STRIDE = 65_536;

const M = [0x9e3779b1, 0x85ebca77, 0xc2b2ae3d, 0x7feb352d, 0x846ca68b, 0x27d4eb2f] as const;

/** Columnas de un tramo de muro de `length` m (0 si no cabe una ventana). */
export function columnsFor(length: number, spacing: number = WINDOW_SPACING): number {
  return length < spacing * 0.75 ? 0 : Math.max(1, Math.round(length / spacing));
}

/** Hash de 32 bits sin signo de tres enteros ≥ 0 (lowbias32 sobre la mezcla con semilla: (0,0,0) ≠ 0). */
export function hashU32(a: number, b: number, c: number): number {
  let h = Math.imul(a, M[0]) ^ Math.imul(b, M[1]) ^ Math.imul(c, M[2]) ^ M[5];
  h ^= h >>> 16;
  h = Math.imul(h, M[3]);
  h ^= h >>> 15;
  h = Math.imul(h, M[4]);
  h ^= h >>> 16;
  return h >>> 0;
}

/** El hash en [0, 1) con 24 bits (exacto también en float del shader). */
export function hash01(a: number, b: number, c: number): number {
  return (hashU32(a, b, c) >>> 8) / 16_777_216;
}

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** ¿La ventana (edificio, piso, columna) está encendida en el segundo `timeS` con la noche `night`? */
export function windowLit(building: number, level: number, column: number, timeS: number, night: number): boolean {
  const r0 = hash01(building, level, column);
  const period = PERIOD_MIN + PERIOD_SPAN * r0;
  const slot = Math.floor((timeS + r0 * period) / period);
  const fraction = LIT_FRACTION * smoothstep(0.15, 0.85, night);
  return hash01(building, level * ROW_STRIDE + column, slot) < fraction;
}

const hex = (n: number) => `0x${n.toString(16).toUpperCase()}u`;

/** GLSL del hash y del encendido (necesita `uniform float uTime`, que trae LIGHT_GLSL). */
export const WINDOW_GLSL = /* glsl */ `
uint hashU32(uint a, uint b, uint c) {
  uint h = (a * ${hex(M[0])}) ^ (b * ${hex(M[1])}) ^ (c * ${hex(M[2])}) ^ ${hex(M[5])};
  h ^= h >> 16u;
  h *= ${hex(M[3])};
  h ^= h >> 15u;
  h *= ${hex(M[4])};
  h ^= h >> 16u;
  return h;
}
float hash01(float a, float b, float c) {
  return float(hashU32(uint(a), uint(b), uint(c)) >> 8u) / 16777216.0;
}
float windowLit(float building, float level, float column, float night) {
  float r0 = hash01(building, level, column);
  float period = ${PERIOD_MIN.toFixed(1)} + ${PERIOD_SPAN.toFixed(1)} * r0;
  float slot = floor((uTime + r0 * period) / period);
  float fraction = ${LIT_FRACTION} * smoothstep(0.15, 0.85, night);
  return hash01(building, level * ${ROW_STRIDE.toFixed(1)} + column, slot) < fraction ? 1.0 : 0.0;
}
`;
