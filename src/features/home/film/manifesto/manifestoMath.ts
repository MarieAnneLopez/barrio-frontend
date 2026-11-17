// Matemática pura del manifiesto elástico (capítulo 1 del Inicio). Tiempos en segundos; los números
// son los de docs/superpowers/specs/2026-11-16-interfaz-elegante-design.md, §6.
const WORD_STAGGER = 0.088; // cada palabra arranca este tiempo después de la anterior
const WORD_DURATION = 0.875;
const REVEAL_DURATION = 1.1;
const PERIOD = 0.72; // de la elástica

export interface WordFrame {
  transform: string;
  opacity: string;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
/** Cuatro decimales bastan para un estilo y dejan cadenas cortas. */
const round = (value: number): number => Math.round(value * 1e4) / 1e4;

/** Elástica de salida (amplitud 1, periodo 0,72): llega a 1, se pasa y vuelve. No se limita. */
export function elastic(raw: number): number {
  if (raw <= 0) return 0;
  if (raw >= 1) return 1;
  return 2 ** (-10 * raw) * Math.sin(((raw - PERIOD / 4) * 2 * Math.PI) / PERIOD) + 1;
}

/** Avance lineal (0 a 1) de la palabra `i` en el segundo `t`. */
export const wordRaw = (t: number, i: number): number => clamp((t - WORD_STAGGER * i) / WORD_DURATION);

/** Estilo de la palabra `i` en el segundo `t`: `rest` es lo que le falta para llegar (negativo en el rebote). */
export function wordFrame(t: number, i: number): WordFrame {
  const raw = wordRaw(t, i);
  const rest = 1 - elastic(raw);
  const move = `translate(${round(40 * rest)}%, ${round(-10 * rest)}%)`;
  const squash = `scale(${round(1 - 0.15 * rest)}, ${round(1 - 0.9 * rest)})`;
  return { transform: `${move} ${squash} rotate(${round(8 * rest)}deg)`, opacity: String(round(clamp(5 * raw))) };
}

/** Avance `b` de la revelación del papel: sale rápido y frena (cúbica de salida). */
export const revealProgress = (t: number): number => 1 - (1 - clamp(t / REVEAL_DURATION)) ** 3;

/** Elipse que recorta la capa papel: crece desde la esquina de abajo a la derecha. */
export const revealClip = (b: number): string => `ellipse(${round(20 + 130 * b)}% ${round(150 * b)}% at 100% 100%)`;

/** ¿La elipse ya cubre toda la capa? La esquina de arriba a la izquierda es la última en entrar. */
export const revealCovers = (b: number): boolean => b > 0 && (0.2 + 1.3 * b) ** -2 + (1.5 * b) ** -2 <= 1;

/** Duración total con `words` palabras: la última palabra o la revelación, lo que acabe después. */
export const playDuration = (words: number): number =>
  Math.max(REVEAL_DURATION, WORD_STAGGER * Math.max(0, words - 1) + WORD_DURATION);
