// Variante determinista de la entrada de cada sección (D101). Cada dimensión recorre su lista en
// el orden del menú, así dos secciones seguidas nunca repiten esquina, orden de palabras, desfase
// de líneas ni color revelado; el Inicio (índice 0) es el manifiesto tal cual. Las rutas que no
// están en el menú toman un índice estable a partir de su texto.
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES } from '../../lib/navigation';
import type { Corner, WordOrder } from './introMath';

export type RevealColor = 'crema' | 'rosa-claro' | 'rosa';

export interface IntroVariant {
  corner: Corner;
  order: WordOrder;
  /** Sangría de cada línea, en % del ancho de la sección. */
  indents: readonly number[];
  reveal: RevealColor;
}

const CORNERS: readonly Corner[] = ['br', 'tl', 'bl', 'tr'];
const ORDERS: readonly WordOrder[] = ['forward', 'backward', 'center'];
const INDENTS: readonly (readonly number[])[] = [[0, 26, 4], [14, 0, 24], [28, 8, 0]];
const REVEALS: readonly RevealColor[] = ['crema', 'rosa-claro', 'rosa'];

export const MENU_PATHS: readonly string[] = [
  ...NAV_BEFORE_CATEGORIES.map((item) => item.path),
  ...CATEGORIES.map((category) => categoryPath(category.slug)),
  ...NAV_AFTER_CATEGORIES.map((item) => item.path),
];

const normalize = (path: string): string => (path.length > 1 ? path.replace(/\/+$/, '') : path);

/** Índice estable para una ruta fuera del menú (suma de sus códigos, desplazada tras el menú). */
const hashIndex = (path: string): number =>
  MENU_PATHS.length + [...path].reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0);

const pick = <T,>(list: readonly T[], at: number): T => list[at % list.length] as T;

export function introVariant(pathname: string): IntroVariant {
  const path = normalize(pathname);
  const found = MENU_PATHS.indexOf(path);
  const at = found >= 0 ? found : hashIndex(path);
  return { corner: pick(CORNERS, at), order: pick(ORDERS, at), indents: pick(INDENTS, at), reveal: pick(REVEALS, at) };
}
