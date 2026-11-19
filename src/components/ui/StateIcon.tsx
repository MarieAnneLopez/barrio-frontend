export type StateKind = 'error' | 'warning' | 'success';

// Trazos en 24 × 24: círculo con aspa (error), triángulo con exclamación (aviso) y círculo con visto
// (éxito). Formas distintas, así el estado no depende solo del color.
const SHAPE: Record<StateKind, string> = {
  error: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M9 9l6 6M15 9l-6 6',
  warning: 'M12 3.5L2.5 20h19ZM12 10v4.5M12 17.5v.01',
  success: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M8 12.5l2.75 2.75L16 9.75',
};
const COLOR: Record<StateKind, string> = { error: 'text-error', warning: 'text-warning', success: 'text-success' };

/**
 * Ícono de un estado semántico (D100: siempre con ícono y texto; PAL-06). SVG en línea, oculto al
 * lector de pantalla porque el texto ya dice el estado; va antes del texto, a la altura de la letra
 * y en el color del estado (≥ 5:1 sobre crema y rosa claro; los claros en alto contraste).
 */
export function StateIcon({ kind }: { kind: StateKind }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-state-icon={kind}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mr-1.5 inline-block size-[1.15em] shrink-0 align-[-0.2em] ${COLOR[kind]}`}
    >
      <path d={SHAPE[kind]} />
    </svg>
  );
}
