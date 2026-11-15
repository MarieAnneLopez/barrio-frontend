// Estilo de las figuras de cada módulo en la maqueta (DISENO-V2 §9, D79). Los colores de
// la paleta están muy próximos entre sí (1,65–2,8 entre vecinos), así que cada categoría
// se distingue también por el trazo (continuo o guion corto/largo, en metros) y la claridad.
// La leyenda dibuja el mismo trazo: mapa y leyenda no pueden separarse.
import type { PaletteToken } from '../lib/cssToken';

export interface ShapeStyle {
  token: PaletteToken | 'blanco';
  opacity: number;
  /** [guion, espacio] en metros; null = trazo continuo. */
  dash: [number, number] | null;
  /** Forma de la muestra en la leyenda: grosor de la línea, o relleno para áreas. */
  swatch: 'relleno' | 'fino' | 'grueso';
}

export const SHAPE_STYLE: Record<string, ShapeStyle> = {
  'estado-calles': { token: 'blanco', opacity: 0.95, dash: null, swatch: 'grueso' },
  'zonas-verdes': { token: 'lavanda', opacity: 1, dash: null, swatch: 'relleno' },
  'escenarios-deportivos': { token: 'blanco', opacity: 0.9, dash: [6, 5], swatch: 'grueso' },
  'datos-catastrales': { token: 'claro', opacity: 0.35, dash: null, swatch: 'fino' },
  localidad: { token: 'blanco', opacity: 0.85, dash: [40, 20], swatch: 'grueso' },
};

export const DEFAULT_SHAPE: ShapeStyle = { token: 'claro', opacity: 0.8, dash: null, swatch: 'fino' };

/** Valor CSS del token (para la muestra de la leyenda). */
export function cssColorOf(style: ShapeStyle): string {
  return style.token === 'blanco' ? '#ffffff' : `var(--palette-${style.token})`;
}

/** Patrón SVG de la muestra: guion corto, largo o continuo, como en la maqueta. */
export function swatchDash(style: ShapeStyle): string | undefined {
  if (!style.dash) return undefined;
  return style.dash[0] > 20 ? '8 4' : '3 3';
}
