// Colores de las estrellas tal como los pinta stars.css (D100, PAL-09), para las pruebas de contraste.
import { readSrc } from './classContrast';

const css = readSrc('components', 'ui', 'stars.css').replace(/\/\*[\s\S]*?\*\//g, '');

/** Cuerpo de la regla con ese selector exacto (sin comentarios). */
export const starRule = (selector: string) =>
  new RegExp(`(?:^|\\n)${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

/** Valor de una declaración dentro del cuerpo de una regla. */
export const declaration = (body: string, name: string) =>
  new RegExp(`(?:^|[\\s;])${name}:\\s*([^;]+);`).exec(body)?.[1]?.trim();

/** Relleno y contorno de una llena y contorno de una vacía, con la regla de alto contraste si toca. */
export function starColors(high: boolean) {
  const [full, override] = [starRule('.stars-full'), high ? starRule(':root.high-contrast .stars-full') : ''];
  return {
    fill: declaration(override, 'fill') ?? declaration(full, 'fill') ?? '',
    stroke: declaration(override, 'stroke') ?? declaration(full, 'stroke') ?? '',
    empty: declaration(starRule('.stars-empty'), 'stroke') ?? '',
  };
}
