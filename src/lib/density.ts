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
