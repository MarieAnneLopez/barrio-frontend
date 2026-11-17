// Composición de la portada tipográfica de cada módulo: en qué cuerpo y en cuántas líneas cabe el
// nombre. Funciones puras; quien mide el texto de verdad es el canvas (coverTexture.ts).

/** Lo que lleva la portada de un módulo. */
export interface Cover {
  /** Número del módulo con dos cifras. */
  number: string;
  /** Nombre ya traducido. */
  name: string;
}

/** Lienzo de la portada, con la proporción del plano (2,38 × 1,5771). */
export const COVER = { width: 1024, height: 678, margin: 64 } as const;

export interface TextBox {
  width: number;
  height: number;
  maxLines: number;
  /** Interlineado, en cuerpos. */
  leading: number;
  /** Cuerpos a probar, de mayor a menor. */
  sizes: readonly number[];
}

/** Caja del nombre: todo el ancho menos los márgenes, bajo el número y su regla. */
export const NAME_BOX: TextBox = {
  width: COVER.width - COVER.margin * 2,
  height: 380,
  maxLines: 3,
  leading: 1.04,
  sizes: [176, 160, 144, 128, 112, 96, 80, 64],
};

export interface Fit {
  size: number;
  lines: string[];
}

export type Measure = (text: string, size: number) => number;

/** Número del módulo con dos cifras: 1 → «01». */
export const coverNumber = (id: number): string => String(id).padStart(2, '0');

/** Reparte las palabras en líneas sin pasarse del ancho. Una palabra más ancha que la caja va sola. */
export function wrapWords(words: readonly string[], widthOf: (text: string) => number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && widthOf(`${last} ${word}`) <= maxWidth) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

/** El cuerpo más grande con el que el nombre cabe en la caja; si ninguno cabe, el menor. */
export function fitLines(words: readonly string[], measure: Measure, box: TextBox): Fit {
  const wrap = (size: number) => wrapWords(words, (text) => measure(text, size), box.width);
  for (const size of box.sizes) {
    const lines = wrap(size);
    const tall = lines.length * size * box.leading;
    if (lines.length <= box.maxLines && tall <= box.height && lines.every((line) => measure(line, size) <= box.width)) {
      return { size, lines };
    }
  }
  const size = box.sizes[box.sizes.length - 1] ?? 0;
  return { size, lines: wrap(size) };
}
