// Relleno de las figuras del módulo en el mapa temático (D82, opción B): relleno liso (zonas
// verdes), rayado (datos catastrales) o solo borde (el resto). Siempre en los verdes del mapa.
import type { ExpressionSpecification, FillLayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { mapColor } from '../../lib/cssToken';

const HATCH = 'modulo-rayado';
const selected: ExpressionSpecification = ['boolean', ['feature-state', 'selected'], false];
type FillPaint = NonNullable<FillLayerSpecification['paint']>;

/** Patrón 8×8 de rayas diagonales verde salvia, dibujado en un canvas local (sin imágenes externas). */
function addHatch(map: MapLibreMap): boolean {
  if (typeof map.hasImage !== 'function' || typeof map.addImage !== 'function') return false;
  if (map.hasImage(HATCH)) return true;
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.strokeStyle = mapColor('salvia');
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of [[0, 8, 8, 0], [-2, 2, 2, -2], [6, 10, 10, 6]] as const) {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  ctx.stroke();
  map.addImage(HATCH, ctx.getImageData(0, 0, 8, 8));
  return true;
}

export function fillPaint(map: MapLibreMap, slug: string): FillPaint {
  const ink = mapColor('bosque');
  if (slug === 'zonas-verdes') return { 'fill-color': ink, 'fill-opacity': ['case', selected, 0.7, 0.45] };
  if (slug === 'datos-catastrales' && addHatch(map)) {
    return { 'fill-pattern': HATCH, 'fill-opacity': ['case', selected, 1, 0.85] };
  }
  // Solo borde: un velo mínimo deja la figura clicable sin rellenarla.
  return { 'fill-color': ink, 'fill-opacity': ['case', selected, 0.3, 0.06] };
}
