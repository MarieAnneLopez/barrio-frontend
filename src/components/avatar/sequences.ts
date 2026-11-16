import generated from './sequences.json';

export type SequenceName = 'run' | 'wave' | 'sit';

/**
 * Sentada moviendo la pierna (D82): los 8 cuadros de "Mini marie sentada.jpeg" con el fondo
 * quitado por un script puntual fuera del proyecto; scripts/slice_sequences.mjs no la regenera.
 */
const SIT = { name: 'sit', frames: 8, width: 116, height: 192, source: 'Mini marie sentada.jpeg', seamCrossed: [] };
const sequences = [...generated, SIT];

/** Milisegundos por cuadro: carrera ágil (8 × 90 = 720 ms por zancada), saludo pausado, sentada a 8 fps. */
export const FRAME_MS: Record<SequenceName, number> = { run: 90, wave: 140, sit: 125 };

/** Cuadros, tamaño y fuente de cada secuencia (scripts/slice_sequences.mjs, H33). */
export function sequenceSpec(name: SequenceName) {
  const spec = sequences.find((s) => s.name === name);
  if (!spec) throw new Error(`Secuencia desconocida: ${name}`);
  return spec;
}
