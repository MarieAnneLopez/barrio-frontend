// Contraste de lo que un componente combina de verdad: resuelve las utilidades de color de
// Tailwind (`bg-*`, `text-*`) con el bloque @theme de index.css y los tokens, en modo estándar y
// en alto contraste. Los pares de tokens sueltos se miden en styles/tokens.test.ts.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRatio, over, parseVars, resolveColor } from './colorMath';

export const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..');
export const readSrc = (...path: string[]) => readFileSync(join(srcDir, ...path), 'utf8');

const base = parseVars(readSrc('styles', 'tokens.css'), ':root');
const high = new Map([...base, ...parseVars(readSrc('styles', 'contrast.css'), ':root.high-contrast')]);
export type Vars = Map<string, string>;
export const MODES: [string, Vars][] = [['estándar', base], ['alto contraste', high]];

/** Utilidad de color (`interactive`, `on-stone`…) → su token (`var(--interactive-primary)`). */
export const THEME = new Map(
  [...readSrc('styles', 'index.css').matchAll(/--color-([\w-]+):\s*(var\(--[\w-]+\))/g)].map((m) => [m[1] ?? '', m[2] ?? '']),
);

/** ¿El color tapa del todo lo que tiene debajo en la paleta estándar? */
export const isOpaque = (color: string) => resolveColor(color, base)[3] === 1;

/** Contraste de un texto sobre un fondo (tokens o `var(--x)`), compuestos sobre la página. */
export function tokenRatio(text: string, bg: string, vars: Vars): number {
  const back = over(resolveColor(bg, vars), resolveColor('var(--bg-primary)', vars));
  return contrastRatio(over(resolveColor(text, vars), back), back);
}

/** Contraste de un texto sobre su fondo teñido con un `percent` % del propio texto (hover «ghost»). */
export function tintedRatio(text: string, bg: string, percent: number, vars: Vars): number {
  const back = over(resolveColor(bg, vars), resolveColor('var(--bg-primary)', vars));
  const ink = over(resolveColor(text, vars), back);
  return contrastRatio(ink, over([ink[0], ink[1], ink[2], percent / 100], back));
}

export interface ClassPair {
  bg: string;
  text: string;
}

/**
 * Pares fondo + texto que una misma cadena de clases deja activos a la vez: el par base y el de
 * cada variante (`hover:`, `focus:`, `placeholder:`…), que hereda del base lo que no redefine.
 */
export function classPairs(classes: string): ClassPair[] {
  const groups = new Map<string, Partial<ClassPair>>();
  for (const token of classes.split(/\s+/)) {
    const [, variant = '', kind, name = ''] = /^((?:[^\s:]+:)*)(bg|text)-([\w-]+)$/.exec(token) ?? [];
    if (!kind || !THEME.has(name)) continue;
    groups.set(variant, { ...groups.get(variant), [kind]: name });
  }
  const root = groups.get('') ?? {};
  return [...groups.values()].flatMap(({ bg = root.bg, text = root.text }) => (bg && text ? [{ bg, text }] : []));
}

/** Contraste entre el fondo base de una cadena de clases y el texto base de otra (elementos distintos). */
export function classRatio(bgClasses: string, textClasses: string, vars: Vars): number {
  const pick = (classes: string, kind: 'bg' | 'text') =>
    classes.split(/\s+/).map((token) => new RegExp(`^${kind}-([\\w-]+)$`).exec(token)?.[1] ?? '').find((name) => THEME.has(name));
  const [bg, text] = [pick(bgClasses, 'bg'), pick(textClasses, 'text')];
  if (!bg || !text) throw new Error(`Sin par de color: «${bgClasses}» / «${textClasses}»`);
  return tokenRatio(THEME.get(text) ?? '', THEME.get(bg) ?? '', vars);
}
