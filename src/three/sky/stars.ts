import { FOV_DEG } from '../referenceView';

// Estrellas de la cúpula (D106). La cámara de la maqueta mira con un teleobjetivo de 10°: con 220
// celdas por radián cada estrella era un cuadrado de ~23 px a 900 px de alto (en el modo mapa se
// veían «rectángulos blancos»). Con 1400 celdas por radián la celda mide ~3,7 px y la estrella es
// un punto redondo dentro de ella.

/** Celdas por radián de la esfera del cielo. */
export const STAR_CELLS = 1400;
/** Densidad angular para que también se distingan estrellas en el estrecho encuadre del mapa. */
export const STARS_PER_SQ_RADIAN = 3200;
/** Umbral del hash para encender una celda: la probabilidad por celda da la densidad pedida. */
export const STAR_THRESHOLD = 1 - STARS_PER_SQ_RADIAN / (STAR_CELLS * STAR_CELLS);

/** Lado de una celda de estrella en px, con la vista de `fovDeg` grados y `heightPx` de alto. */
export function starCellPx(heightPx: number, fovDeg = FOV_DEG, cells = STAR_CELLS): number {
  const cellDeg = (1 / cells) * (180 / Math.PI);
  return (cellDeg / fovDeg) * heightPx;
}

/**
 * GLSL: brillo de estrella (0–1) en la dirección `dir` (unitaria). Hash de Dave Hoskins (hash13,
 * MIT): estable con coordenadas de celda grandes, donde el de sin() pierde precisión y hace patrones.
 */
export const STAR_GLSL = /* glsl */ `
float starHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float starAt(vec3 dir) {
  vec3 cell = dir * ${STAR_CELLS.toFixed(1)};
  float on = step(${STAR_THRESHOLD.toFixed(8)}, starHash(floor(cell)));
  float dot3 = length(fract(cell) - 0.5);
  float variation = starHash(floor(cell) + vec3(19.0, 7.0, 41.0));
  float radius = mix(0.25, 0.46, variation);
  return on * mix(0.40, 1.0, variation) * (1.0 - smoothstep(radius * 0.5, radius, dot3));
}
`;
