/**
 * Media query «pantalla más densa que `dppx`», con el alias que entiende Safari antes de la 16.
 * `when` antepone otra condición a las dos ramas, p. ej. '(min-width: 640px)'.
 *
 * Sirve para elegir con <picture> el recurso exacto de Mini Marie (D86): con `srcset`, a 125 % de
 * escala el navegador se queda con el recurso pequeño y lo estira.
 */
export function denserThan(dppx: number, when?: string): string {
  const prefix = when ? `${when} and ` : '';
  return [`(min-resolution: ${dppx}dppx)`, `(-webkit-min-device-pixel-ratio: ${dppx})`].map((query) => prefix + query).join(', ');
}

/**
 * Múltiplo del recurso según la densidad de pantalla (D86), de mayor a menor: el cuádruple por
 * encima de 2,01 dppx y el doble por encima de 1,01. Lo usan SequenceSprite y la pantalla de carga.
 */
export const DENSER = [[4, 2.01], [2, 1.01]] as const;
