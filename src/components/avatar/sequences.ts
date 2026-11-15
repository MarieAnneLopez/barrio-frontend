import sequences from './sequences.json';

export type SequenceName = 'run' | 'wave';

/** Milisegundos por cuadro: carrera ágil (8 × 90 = 720 ms por zancada), saludo pausado. */
export const FRAME_MS: Record<SequenceName, number> = { run: 90, wave: 140 };

/** Cuadros, tamaño y fuente de cada secuencia (scripts/slice_sequences.mjs, H33). */
export function sequenceSpec(name: SequenceName) {
  const spec = sequences.find((s) => s.name === name);
  if (!spec) throw new Error(`Secuencia desconocida: ${name}`);
  return spec;
}
