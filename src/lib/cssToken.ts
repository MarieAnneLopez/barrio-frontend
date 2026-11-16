// Lee los colores del design system en tiempo de ejecución (para MapLibre y three),
// así el mapa sigue la paleta, el alto contraste y nunca lleva colores sueltos.
export type PaletteToken = 'principal' | 'intenso' | 'claro' | 'lavanda' | 'oscuro';

export function cssVar(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Color hexadecimal de la paleta oficial (`--palette-<token>` en tokens.css). */
export function paletteColor(token: PaletteToken): string {
  return cssVar(`--palette-${token}`, 'black');
}

/** Roles del tema único de los mapas (D83, styles/map-palette.css): colores medidos en la referencia. */
export type MapToken =
  | 'fondo' | 'suelo' | 'manzana' | 'lote' | 'via' | 'via-borde' | 'parque' | 'agua' | 'edificio-bajo'
  | 'edificio-medio' | 'edificio-alto' | 'sombra' | 'contorno' | 'limite' | 'control';

export function mapColor(token: MapToken): string {
  return cssVar(`--map-${token}`, 'black');
}
