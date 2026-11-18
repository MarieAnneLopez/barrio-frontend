// Ventanas de los edificios (shader): filas por piso y columnas cada ~3 m a lo largo de cada muro.
// De noche se encienden al azar con un hash entero por edificio, piso y columna, y cambian despacio
// con el reloj (uTime). Esta versión en TypeScript es el espejo exacto del GLSL de abajo (mismas
// constantes y operaciones de 32 bits) y es la que prueban las pruebas.

/** Separación entre columnas de ventanas a lo largo del muro (m reales, sin exagerar). */
export const WINDOW_SPACING = 3;
/** Fracción de ventanas encendidas en plena noche (decorativo: no es un dato). */
export const LIT_FRACTION = 0.42;
/** El reloj del shader (uTime, en [0, 3600)) vuelve a 0 cada hora: SkyDriver usa Date.now() % 3 600 000. */
export const CLOCK_WRAP_S = 3600;
/**
 * Cada ventana revisa si cambia SLOTS_MIN … SLOTS_MIN + SLOTS_SPAN − 1 veces por hora (cada 90 a
 * 240 s). Con un número entero de turnos por hora, el turno sigue igual cuando el reloj vuelve a 0:
 * no hay un cambio de todas las ventanas a la vez cada hora en punto.
 */
export const SLOTS_MIN = 15;
export const SLOTS_SPAN = 26;
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

/** Fracción de ventanas encendidas según la noche (0 de día; sube en el atardecer). */
export const litFraction = (night: number): number => LIT_FRACTION * smoothstep(0.15, 0.85, night);

/** ¿La ventana (edificio, piso, columna) está encendida en el segundo `timeS` con la noche `night`? */
export function windowLit(building: number, level: number, column: number, timeS: number, night: number): boolean {
  const r0 = hash01(building, level, column);
  const slots = SLOTS_MIN + Math.floor(r0 * SLOTS_SPAN);
  // El turno número `slots` (al final de la hora, por el desfase r0) es el mismo turno 0 de la hora
  // siguiente. Se resta en vez de usar mod: en la GPU mod(x, x) puede dar x por redondeo.
  const raw = Math.floor((timeS * slots) / CLOCK_WRAP_S + r0);
  const slot = raw >= slots ? raw - slots : raw;
  return hash01(building, level * ROW_STRIDE + column, slot) < litFraction(night);
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
float litFraction(float night) {
  return ${LIT_FRACTION} * smoothstep(0.15, 0.85, night);
}
float windowLit(float building, float level, float column, float night) {
  float r0 = hash01(building, level, column);
  float slots = ${SLOTS_MIN.toFixed(1)} + floor(r0 * ${SLOTS_SPAN.toFixed(1)});
  float raw = floor(uTime * slots / ${CLOCK_WRAP_S.toFixed(1)} + r0);
  float slot = raw >= slots ? raw - slots : raw;
  return hash01(building, level * ${ROW_STRIDE.toFixed(1)} + column, slot) < litFraction(night) ? 1.0 : 0.0;
}
`;
