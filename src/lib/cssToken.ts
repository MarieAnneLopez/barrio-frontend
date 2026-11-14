// Lee los colores del design system en tiempo de ejecución (para MapLibre y three),
// así el mapa sigue la paleta, el alto contraste y nunca lleva colores sueltos.
export type PaletteToken = 'ink' | 'navy' | 'sky' | 'cobalt' | 'azure';

export function cssVar(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Color hexadecimal de la paleta oficial (`--palette-<token>` en tokens.css). */
export function paletteColor(token: PaletteToken): string {
  return cssVar(`--palette-${token}`, 'black');
}
