import scales from './spriteScales.json';

export type SequenceName = 'run' | 'wave' | 'sit' | 'idle';

/**
 * Milisegundos por cuadro de los ciclos de 32 (sprites32): carrera a 24 fps (1,33 s por ciclo),
 * saludo y sentada a 20 fps (1,6 s) y reposo a 12 fps (2,67 s por respiración).
 */
export const FRAME_MS: Record<SequenceName, number> = { run: 1000 / 24, wave: 50, sit: 50, idle: 1000 / 12 };

/**
 * Tamaños fijos (alto en px) de cada secuencia: «escala entera» (D86). Los dibujos de Mini Marie
 * no siguen una rejilla de píxel regular, así que no se escalan con CSS: cada tamaño es un atlas
 * generado por scripts/build_sprite_scales.mjs con celdas de ancho entero, y se muestra 1:1.
 * Cada secuencia es un ciclo de 32 cuadros (8 columnas × 4 filas). Carrera, saludo y sentada salen
 * enteros de las hojas de 32 cuadros que entregó Martín (D124; scripts/sprite32); el reposo, del
 * cuadro de Marie y sus intermedios (sprites32). La carrera tiene además 105 px (la cuarta parte de
 * 420) para un corredor pequeño.
 */
export const SPRITE_SIZES: Record<SequenceName, readonly number[]> = {
  wave: scales.wave.sizes,
  run: scales.run.sizes,
  sit: scales.sit.sizes,
  idle: scales.idle.sizes,
};

/**
 * Los mismos tamaños como tipos, para que uno que la secuencia no tiene no compile. Deben coincidir
 * con spriteScales.json, que genera `npm run sprites` (lo vigila spriteSizes.test.tsx).
 */
export const SIZES = { wave: [80, 160, 320, 640], run: [105, 210, 420], sit: [48, 96, 192], idle: [140, 280, 560] } as const;
export type SpriteSize<N extends SequenceName> = (typeof SIZES)[N][number];

export interface SequenceSpec {
  frames: number;
  sizes: readonly number[];
  /** Columnas y filas del atlas. */
  grid: readonly [number, number];
  /** Índice en el ciclo de cada pose fija (la `pose` de SequenceSprite; en el saludo, 1–4 con el brazo arriba). */
  keys: readonly number[];
}

/** Cuadros de la secuencia, sus tamaños, la rejilla del atlas y dónde caen los cuadros dibujados. */
export function sequenceSpec(name: SequenceName): SequenceSpec {
  const [cols = 1, rows = 1] = scales[name].grid;
  return { frames: scales[name].frames, sizes: SPRITE_SIZES[name], grid: [cols, rows], keys: scales[name].keys };
}

function scaled(name: SequenceName, size: number, [width = 1, height = 1]: readonly number[]): number {
  if (!SPRITE_SIZES[name].includes(size)) {
    throw new Error(`Mini Marie (${name}) no tiene el tamaño ${size} px: usa ${SPRITE_SIZES[name].join(', ')}`);
  }
  return (width * size) / height;
}

/** Ancho en px de la caja (lo que ocupa en la maqueta) a ese alto. Falla con un tamaño que no sea de la secuencia. */
export const cellWidth = (name: SequenceName, size: number): number => scaled(name, size, scales[name].box);

/** Ancho en px de una celda del atlas a ese alto: igual a la caja, salvo el saludo (el brazo sale por la derecha). */
export const atlasCellWidth = (name: SequenceName, size: number): number => scaled(name, size, scales[name].cell);

export const spriteUrl = (name: SequenceName, size: number) => `/assets/avatar/${name}/${name}_${size}.webp`;

/** Desplazamientos (px enteros) que muestran el cuadro `frame` del ciclo: la columna en X, la fila en Y. */
export function frameTransforms(name: SequenceName, size: number, frame: number): { across: string; down: string } {
  const [cols] = sequenceSpec(name).grid;
  const across = `translateX(${-(frame % cols) * atlasCellWidth(name, size)}px)`;
  return { across, down: `translateY(${-Math.floor(frame / cols) * size}px)` };
}
