// Matemática de la entrada de cada sección (D101): las mismas ecuaciones del manifiesto del Inicio
// (manifestoMath: E(raw), escalonado, duraciones y elipse del revelado); aquí solo lo que varía por
// ruta: la esquina desde donde se abre el revelado, el orden en que arrancan las palabras y el
// reparto del titular en líneas con su cuerpo. Sin DOM.
export type Corner = 'br' | 'tl' | 'bl' | 'tr';
export type WordOrder = 'forward' | 'backward' | 'center';

const AT: Record<Corner, string> = { br: '100% 100%', tl: '0% 0%', bl: '0% 100%', tr: '100% 0%' };
const MAX_SIZE = 16.2; // cuerpo del manifiesto en pantallas angostas (% del ancho)
const ADVANCE = 0.56; // ancho medio de una mayúscula de Anton con el tracking del titular (em)
const ROOM = 86; // % del ancho que puede ocupar una línea: descuenta el margen interior de la capa
const LEADING = 0.96; // interlineado del titular (section-intro.css)
const FLOOR = 24; // px reales: un título marrón sobre crema solo vale como texto grande (D110)

const round = (value: number): number => Math.round(value * 1e4) / 1e4;

/** Elipse del revelado (radios del manifiesto) con centro en `corner`. */
export const cornerClip = (corner: Corner) => (b: number): string =>
  `ellipse(${round(20 + 130 * b)}% ${round(150 * b)}% at ${AT[corner]})`;

/** Centro de la elipse en CSS («100% 100%»), para el estado cerrado de la hoja. */
export const cornerAt = (corner: Corner): string => AT[corner];

/** Índice de arranque de cada palabra (0 = la primera en salir). */
export function staggerOrder(order: WordOrder, count: number): number[] {
  const words = Array.from({ length: count }, (_, i) => i);
  if (order === 'forward') return words;
  if (order === 'backward') return words.map((i) => count - 1 - i);
  const middle = (count - 1) / 2;
  const sequence = [...words].sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle) || a - b);
  return words.map((i) => sequence.indexOf(i));
}

const letters = (line: readonly string[]): number => line.join(' ').length;

/** Hasta 3 palabras, una por línea; con más, 3 líneas en orden con la más larga lo más corta posible. */
export function splitLines(words: readonly string[]): string[][] {
  if (words.length <= 3) return words.map((word) => [word]);
  let best: string[][] = [];
  let bestLength = Infinity;
  for (let a = 1; a < words.length - 1; a += 1) {
    for (let b = a + 1; b < words.length; b += 1) {
      const lines = [words.slice(0, a), words.slice(a, b), words.slice(b)];
      const longest = Math.max(...lines.map(letters));
      if (longest < bestLength) [best, bestLength] = [lines, longest];
    }
  }
  return best;
}

/** Cuerpo (% del ancho) para que cada línea, con su sangría (% del ancho), quepa. */
export function fitSize(lines: readonly (readonly string[])[], indents: readonly number[]): number {
  const fits = lines.map((line, at) => (ROOM - (indents[at] ?? 0)) / (ADVANCE * letters(line) + 0.1));
  return round(Math.min(MAX_SIZE, ...fits));
}

export interface TitleBox {
  /** Cuerpo por ancho (fitSize), en % del ancho de la entrada. */
  fit: number;
  lines: number;
  /** Ancho de la entrada y alto visible de la pantalla (svh), en px. */
  width: number;
  height: number;
  /** px de 1rem: la barra de accesibilidad lo cambia (16 por defecto). */
  rem?: number;
}

/**
 * Cuerpo del titular en px, la misma cuenta que section-intro.css (las pruebas atan las dos): manda el
 * ancho; el alto lo limita para no empujar el contenido más de media pantalla, pero nunca por debajo de
 * 24 px (en una pantalla baja crece la entrada en vez de encoger el título); 9rem es el techo.
 */
export function titleSize({ fit, lines, width, height, rem = 16 }: TitleBox): number {
  const byHeight = (0.52 * height - 10 * rem) / (lines * LEADING);
  return Math.max(FLOOR, Math.min((fit * width) / 100, byHeight, 9 * rem));
}
