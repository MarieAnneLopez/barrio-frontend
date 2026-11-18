// Siluetas del barrio de fondo de la pantalla de carga: edificios rectangulares con alguna azotea,
// generados con una semilla fija (siempre el mismo barrio, sin Math.random). Cada tira mide
// TILE.width y no sale de sus bordes: repetida en fila, el bucle del parallax no tiene costura.
export const TILE = { width: 1200, height: 300 } as const;

export interface Skyline {
  /** Trazo de los edificios (un solo path). */
  body: string;
  /** Ventanas, para la fila cercana. */
  windows: string;
}

/** Generador congruencial de Park-Miller: determinista y suficiente para una silueta. */
function seeded(seed: number): () => number {
  let state = seed % 2147483647 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/** Edificios de alto entre `low` y `high` (unidades del viewBox), con ventanas si se piden. */
export function skyline(seed: number, low: number, high: number, withWindows: boolean): Skyline {
  const rand = seeded(seed);
  const body: string[] = [];
  const lights: string[] = [];
  let x = 0;
  while (x < TILE.width - 36) {
    const width = Math.min(Math.round(44 + rand() * 72), TILE.width - x);
    const top = TILE.height - Math.round(low + rand() * (high - low));
    body.push(`M${x} ${TILE.height}V${top}H${x + width}V${TILE.height}Z`);
    if (rand() < 0.4) body.push(`M${x + Math.round(width * 0.25)} ${top}v-12h${Math.max(6, Math.round(width * 0.2))}v12Z`);
    for (let wy = top + 16; withWindows && wy < TILE.height - 24; wy += 24) {
      for (let wx = x + 9; wx <= x + width - 15; wx += 17) if (rand() < 0.55) lights.push(`M${wx} ${wy}h6v9h-6Z`);
    }
    x += width + Math.round(rand() * 8);
  }
  return { body: body.join(''), windows: lights.join('') };
}

/** Nubes: grupos de cápsulas, también en una tira sin costura (unidades 1600 × 220). */
export const CLOUD_TILE = { width: 1600, height: 220 } as const;

export function clouds(seed: number): string {
  const rand = seeded(seed);
  const shapes: string[] = [];
  for (let at = 0; at < 5; at += 1) {
    const cx = Math.round(120 + at * 300 + rand() * 140);
    const cy = Math.round(40 + rand() * 120);
    const w = Math.round(120 + rand() * 110);
    const r = 18;
    shapes.push(`M${cx - w / 2 + r} ${cy}h${w - 2 * r}a${r} ${r} 0 0 1 0 ${2 * r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 0 ${-2 * r}Z`);
    shapes.push(`M${cx - 18} ${cy - 22}a26 26 0 0 1 52 0v22h-52Z`);
  }
  return shapes.join('');
}
