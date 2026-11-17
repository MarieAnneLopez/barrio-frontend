import scales from './spriteScales.json';

export type SequenceName = 'run' | 'wave' | 'sit' | 'idle';

/** Milisegundos por cuadro: carrera ágil (8 × 90 = 720 ms por zancada), saludo pausado, sentada a 8 fps. */
export const FRAME_MS: Record<SequenceName, number> = { run: 90, wave: 140, sit: 125, idle: 1000 };

/**
 * Tamaños fijos (alto en px) de cada secuencia: «escala entera» (D86). Los dibujos de Mini Marie
 * no siguen una rejilla de píxel regular, así que no se escalan con CSS: cada tamaño es un recurso
 * generado por scripts/build_sprite_scales.mjs con celdas de ancho entero, y se muestra 1:1.
 * La sentada sale de «Mini marie sentada.jpeg» (sit_strip.webp, que ningún script regenera) y va
 * sin su tercer cuadro, que en el dibujo viene corrido y parpadeaba (D88): 7 cuadros.
 * `idle` es un solo cuadro, de pie (copia de frame_1.png): el del perfil de la creadora (D88).
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
export const SIZES = { wave: [80, 160, 320, 640], run: [210, 420], sit: [48, 96, 192], idle: [140, 280, 560] } as const;
export type SpriteSize<N extends SequenceName> = (typeof SIZES)[N][number];

/** Cuadros de la secuencia y sus tamaños disponibles. */
export function sequenceSpec(name: SequenceName): { frames: number; sizes: readonly number[] } {
  return { frames: scales[name].frames, sizes: SPRITE_SIZES[name] };
}

/** Ancho en px de un cuadro a ese alto. Falla con un tamaño que no sea de la secuencia. */
export function cellWidth(name: SequenceName, size: number): number {
  if (!SPRITE_SIZES[name].includes(size)) {
    throw new Error(`Mini Marie (${name}) no tiene el tamaño ${size} px: usa ${SPRITE_SIZES[name].join(', ')}`);
  }
  const [width = 1, height = 1] = scales[name].cell;
  return (width * size) / height;
}

export const spriteUrl = (name: SequenceName, size: number) => `/assets/avatar/${name}/${name}_${size}.webp`;
