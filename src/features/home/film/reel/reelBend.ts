// Geometría de una tarjeta: un plano que el shader de vértices enrolla sobre un cilindro.
// Aquí está la misma cuenta en TypeScript, para probarla y para medir la tarjeta ya curvada.

/** Plano de cada tarjeta, en unidades de la escena, y su malla. */
export const PLANE = { width: 2.38, height: 1.5771, segmentsX: 48, segmentsY: 24 } as const;
export const HALF_WIDTH = PLANE.width / 2;
/** Curvatura en reposo y con entrada rápida. */
export const BEND_REST = 0.3;
export const BEND_FAST = 0.42;
/** Amplitud de la ondulación vertical. */
export const RIPPLE = 0.006;

/**
 * Curvado de un punto del plano: angle = (x / halfWidth) · bend; radius = halfWidth / bend;
 * x = sin(angle) · radius; z += (cos(angle) − 1) · radius. El centro no se mueve y los bordes se alejan.
 */
export function bendPoint(x: number, z: number, bend: number): { x: number; z: number } {
  const angle = (x / HALF_WIDTH) * bend;
  const radius = HALF_WIDTH / bend;
  return { x: Math.sin(angle) * radius, z: z + (Math.cos(angle) - 1) * radius };
}

/** Curvatura según la energía de la entrada (0 = reposo, 1 o más = entrada rápida). */
export function bendFor(energy: number): number {
  return BEND_REST + (BEND_FAST - BEND_REST) * Math.min(1, Math.max(0, energy));
}
