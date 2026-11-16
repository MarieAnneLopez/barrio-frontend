// Forma del marcador por grupo de categorías (D82, opción B elegida por Marie): en los verdes del
// mapa las categorías se parecen mucho, así que además del emoji cambia la forma de la placa.
export type MarkerShape = 'circulo' | 'cuadrado' | 'rombo';

/** Seguridad y emergencias: cuadrado. */
const SECURITY = new Set(['camaras-seguridad', 'robos', 'atencion-inmediata']);
/** Movilidad: rombo. */
const MOBILITY = new Set(['estaciones-transporte']);

/** Círculo = servicios · cuadrado = seguridad · rombo = movilidad. */
export function markerShape(slug: string): MarkerShape {
  if (SECURITY.has(slug)) return 'cuadrado';
  if (MOBILITY.has(slug)) return 'rombo';
  return 'circulo';
}
