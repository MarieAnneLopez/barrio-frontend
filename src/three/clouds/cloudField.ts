// Nubes alrededor y debajo de la isla (gran actualización). Regla que garantiza que NUNCA tapan
// edificios ni marcadores: toda nube queda entera bajo el suelo (y < 0). La cámara siempre está
// sobre el suelo y los edificios y marcadores tienen y ≥ 0; el segmento entre dos puntos con y ≥ 0
// no baja de 0, así que nada bajo el suelo puede quedar delante de ellos.

export interface Cloud {
  x: number;
  y: number;
  z: number;
  /** Radio horizontal aproximado de la nube, en metros. */
  size: number;
  /** Giro sobre su eje vertical (variedad). */
  turn: number;
}

/** Alto de una nube respecto a su tamaño: la geometría de Clouds no pasa de este medio alto. */
export const CLOUD_HALF_HEIGHT = 0.55;
/** Margen bajo el suelo para la parte más alta de cada nube. */
export const CLOUD_CLEARANCE = 4;

/** Generador fijo (mulberry32): las mismas nubes en cada visita. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `count` nubes en un disco de radio `radius` alrededor de (cx, cz): unas pegadas a la isla, otras
 * más lejos y más abajo. Todas cumplen y + size · CLOUD_HALF_HEIGHT ≤ −CLOUD_CLEARANCE.
 */
export function cloudField(cx: number, cz: number, radius: number, count: number, seed = 78): Cloud[] {
  const next = random(seed);
  const clouds: Cloud[] = [];
  for (let i = 0; i < count; i++) {
    const angle = next() * Math.PI * 2;
    const distance = radius * (0.55 + 0.75 * Math.sqrt(next()));
    const size = 60 + next() * 140;
    const top = -CLOUD_CLEARANCE - next() * 160;
    clouds.push({
      x: cx + Math.cos(angle) * distance,
      z: cz + Math.sin(angle) * distance,
      y: top - size * CLOUD_HALF_HEIGHT,
      size,
      turn: next() * Math.PI * 2,
    });
  }
  return clouds;
}
