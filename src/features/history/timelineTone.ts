/** Reparto D100 desde 768 px: una de cada cuatro tarjetas pasa a rosa (en el celular sigue crema). */
export const WIDE_ROSA = 'foot-card tone-papel';

/**
 * Tono y tamaño del título de cada hito. Marrón solo sobre crema y grande (D100: ≥ 24 px; el h3 va a
 * peso 600, que no cuenta como negrita): 1,5rem en el celular y step-2 (≥ 26 px) desde 768 px. Los
 * pares van en negro a step-1; la tarjeta que desde 768 px pasa a rosa vuelve allí al negro.
 */
export function titleTone(index: number): string {
  if (index % 2 === 0) return 'text-step-1 text-fg';
  if (index % 4 === 3) return 'text-title text-[1.5rem] md:text-fg md:text-step-1';
  return 'text-title text-[1.5rem] md:text-step-2';
}
