// Sombreado analítico de la cinta (el shader de fragmentos hace la misma cuenta): oscurece lo que se
// hunde hacia el fondo y añade una luz difusa sutil y un brillo. Funciones puras, sin three.

export const SHADING = {
  /** Fuerza del oscurecido hacia el fondo, y profundidad (en halfW) a la que llega entero. */
  darken: 0.8,
  depthShare: 0.5,
  /** Luz (se normaliza), difusa, y brillo de Blinn-Phong: exponente 48, intensidad 0,35. */
  light: [-0.4, 0.5, 1] as const,
  diffuse: 0.12,
  shininess: 48,
  specular: 0.35,
  /** La etiqueta nunca baja de este brillo: así su texto se lee también en las tarjetas del fondo. */
  labelFloor: 0.6,
} as const;

const [lx, ly, lz] = SHADING.light;
const LENGTH = Math.hypot(lx, ly, lz);
/** Dirección de la luz, unitaria. */
export const LIGHT: readonly [number, number, number] = [lx / LENGTH, ly / LENGTH, lz / LENGTH];

/** 1 en z ≥ 0; baja hasta 1 − 0,8 cuando la superficie se hunde `depthShare · halfW` o más. */
export function depthShade(z: number, halfW: number): number {
  const depth = Math.min(1, Math.max(0, -z / (SHADING.depthShare * halfW)));
  return 1 - SHADING.darken * depth;
}

/** Factor difuso: 1 − 0,12 + 0,12 · max(N · L, 0). */
export function diffuseLight(normal: readonly [number, number, number]): number {
  const facing = Math.max(0, normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2]);
  return 1 - SHADING.diffuse + SHADING.diffuse * facing;
}

/** Brillo más bajo que puede recibir la etiqueta: el suelo de la etiqueta con la difusa a cero. */
export const LABEL_MIN_LIGHT = SHADING.labelFloor * (1 - SHADING.diffuse);
