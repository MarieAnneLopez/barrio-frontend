// Texto del manifiesto (capítulo 1): cómo se reparten las palabras del titular. Sin DOM.
export interface NumberedWord {
  text: string;
  /** Posición en orden de lectura (0, 1, 2…): marca el retraso de su animación. */
  index: number;
}

/** Numera las palabras en orden de lectura conservando las líneas. */
export function numberWords(lines: readonly (readonly string[])[]): NumberedWord[][] {
  const before = (line: number) => lines.slice(0, line).reduce((count, words) => count + words.length, 0);
  return lines.map((words, line) => words.map((text, at) => ({ text, index: before(line) + at })));
}

/**
 * Separa el signo final de una palabra («TINTAL.» → «TINTAL» y «.»). Con el tracking negativo del
 * titular el punto se pegaba a la L y parecía parte de ella: aparte, se le puede dar aire.
 */
export function splitMark(text: string): { body: string; mark: string } {
  const at = text.search(/[.!?…]+$/);
  return at > 0 ? { body: text.slice(0, at), mark: text.slice(at) } : { body: text, mark: '' };
}
