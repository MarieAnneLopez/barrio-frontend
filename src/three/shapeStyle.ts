// Color de las figuras de cada módulo en la maqueta (DISENO-V2 §9). La leyenda usa los
// mismos tokens, así el color del mapa y el de la leyenda no pueden separarse.
import type { PaletteToken } from '../lib/cssToken';

export interface ShapeStyle {
  token: PaletteToken | 'blanco';
  opacity: number;
}

export const SHAPE_STYLE: Record<string, ShapeStyle> = {
  'datos-catastrales': { token: 'claro', opacity: 0.4 },
  'estado-calles': { token: 'blanco', opacity: 0.9 },
  'zonas-verdes': { token: 'lavanda', opacity: 1 },
  'escenarios-deportivos': { token: 'claro', opacity: 1 },
  localidad: { token: 'lavanda', opacity: 0.85 },
};

export const DEFAULT_SHAPE: ShapeStyle = { token: 'claro', opacity: 0.8 };

/** Valor CSS del token (para la muestra de color de la leyenda). */
export function cssColorOf(style: ShapeStyle): string {
  return style.token === 'blanco' ? 'var(--text-primary)' : `var(--palette-${style.token})`;
}
