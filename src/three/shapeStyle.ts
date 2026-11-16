// Estilo de las figuras de cada módulo en la maqueta (D79, D82). Todos los colores son verdes
// del mapa (muy próximos entre sí), así que cada categoría se distingue también por el trazo
// (continuo o guion corto/largo, en metros), el grosor de la muestra y la claridad.
// La leyenda dibuja el mismo trazo: mapa y leyenda no pueden separarse.
import type { MapToken } from '../lib/cssToken';

export interface ShapeStyle {
  token: MapToken;
  opacity: number;
  /** [guion, espacio] en metros; null = trazo continuo. */
  dash: [number, number] | null;
  /** Forma de la muestra en la leyenda: grosor de la línea, o relleno para áreas. */
  swatch: 'relleno' | 'fino' | 'grueso';
}

export const SHAPE_STYLE: Record<string, ShapeStyle> = {
  'estado-calles': { token: 'noche', opacity: 0.95, dash: null, swatch: 'grueso' },
  'zonas-verdes': { token: 'bosque', opacity: 1, dash: null, swatch: 'relleno' },
  'escenarios-deportivos': { token: 'noche', opacity: 0.9, dash: [6, 5], swatch: 'grueso' },
  'datos-catastrales': { token: 'salvia', opacity: 0.5, dash: null, swatch: 'fino' },
  localidad: { token: 'hoja', opacity: 0.85, dash: [40, 20], swatch: 'grueso' },
};

export const DEFAULT_SHAPE: ShapeStyle = { token: 'salvia', opacity: 0.8, dash: null, swatch: 'fino' };

/** Valor CSS del token (para la muestra de la leyenda). */
export function cssColorOf(style: ShapeStyle): string {
  return `var(--map-${style.token})`;
}

/** Patrón SVG de la muestra: guion corto, largo o continuo, como en la maqueta. */
export function swatchDash(style: ShapeStyle): string | undefined {
  if (!style.dash) return undefined;
  return style.dash[0] > 20 ? '8 4' : '3 3';
}
