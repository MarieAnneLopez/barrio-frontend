// Lee los colores del design system en tiempo de ejecución (para MapLibre y three),
// así el mapa sigue la paleta, el alto contraste y nunca lleva colores sueltos.

export function cssVar(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Roles del tema único de los mapas (D83, styles/map-palette.css): colores medidos en la referencia. */
export type MapToken =
  | 'fondo' | 'suelo' | 'manzana' | 'lote' | 'via' | 'via-borde' | 'parque' | 'agua' | 'edificio-bajo'
  | 'edificio-medio' | 'edificio-alto' | 'sombra' | 'contorno' | 'limite' | 'control' | DayToken | CycleToken;

/** Ciclo de día y noche (D106): la versión de día de los roles y los colores del cielo. */
export type DayToken = `dia-${
  | 'cielo' | 'horizonte' | 'suelo' | 'manzana' | 'via' | 'via-borde' | 'parque' | 'agua' | 'edificio-bajo'
  | 'edificio-medio' | 'edificio-alto' | 'techo' | 'luz' | 'ambiente'}`;
export type CycleToken = `ciclo-${
  | 'atardecer' | 'cielo-atardecer' | 'sol' | 'luna' | 'luz-luna' | 'ambiente-noche' | 'ventana' | 'brillo-via'
  | 'farol' | 'estrella' | 'tierra' | 'roca' | 'nube'}`;

export function mapColor(token: MapToken): string {
  return cssVar(`--map-${token}`, 'black');
}
