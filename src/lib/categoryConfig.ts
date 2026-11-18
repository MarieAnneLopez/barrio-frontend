// Fuente única de verdad de los 14 módulos (PROMPT_MAESTRO §11.3): rutas,
// emojis de marcadores 2D/3D y tarjetas. Los textos viven en i18n.
export type Geometry = 'POINT' | 'POLYGON' | 'LINESTRING' | 'FICHA';

export interface CategoryConfig {
  /** Número oficial del módulo (1–14). */
  id: number;
  /** Segmento de ruta y clave i18n: categories.<slug>.* */
  slug: string;
  emoji: string;
  geometry: Geometry;
}
// Los campos de cada módulo (tarjeta, filtros, formulario) viven en moduleFields.json.

export const CATEGORIES: readonly CategoryConfig[] = [
  { id: 1, slug: 'centros-educativos', emoji: '🎓', geometry: 'POINT' },
  { id: 2, slug: 'escenarios-deportivos', emoji: '⚽', geometry: 'POLYGON' },
  { id: 3, slug: 'camaras-seguridad', emoji: '📹', geometry: 'POINT' },
  { id: 4, slug: 'zonas-verdes', emoji: '🌳', geometry: 'POLYGON' },
  { id: 5, slug: 'datos-catastrales', emoji: '🏠', geometry: 'POLYGON' },
  { id: 6, slug: 'estado-calles', emoji: '🛣️', geometry: 'LINESTRING' },
  { id: 7, slug: 'estaciones-transporte', emoji: '🚉', geometry: 'POINT' },
  { id: 8, slug: 'sitios-comida', emoji: '👨‍🍳', geometry: 'POINT' },
  { id: 9, slug: 'librerias', emoji: '📚', geometry: 'POINT' },
  { id: 10, slug: 'robos', emoji: '🚨', geometry: 'POINT' },
  { id: 11, slug: 'localidad', emoji: '🏛️', geometry: 'FICHA' },
  { id: 12, slug: 'atencion-inmediata', emoji: '🚑', geometry: 'POINT' },
  { id: 13, slug: 'veterinarias', emoji: '🐾', geometry: 'POINT' },
  { id: 14, slug: 'barberias', emoji: '✂️', geometry: 'POINT' },
];

export const categoryPath = (slug: string) => `/categorias/${slug}`;

export function findCategory(slug: string | undefined): CategoryConfig | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}

/**
 * ¿La maqueta señala los lugares de este módulo? La localidad (FICHA) es la ficha de toda la zona,
 * no un lugar: abarca el barrio entero y más, y su contorno salía de la isla al cielo.
 */
export const onTheModel = (slug: string) => findCategory(slug)?.geometry !== 'FICHA';
