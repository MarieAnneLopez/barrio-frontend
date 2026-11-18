import { describe, expect, it } from 'vitest';
import type { ModuleItem } from '../../lib/apiTypes';
import { buildPlaceLayer, MARKER_Y, type ModuleCollection } from './placeLayers';

const Y = Math.fround(MARKER_Y); // los marcadores van en un Float32Array

const project = ([lon = 0, lat = 0]: readonly number[]): [number, number] => [lon * 1000, lat * 1000];
const item = (id: number, extra: Partial<ModuleItem> = {}): ModuleItem => ({
  id, nombre: `Lugar ${id}`, source_type: 'osm', source_ref: null, verified: true, geometry: null, ...extra,
});
const collection = (rows: [ModuleItem, ModuleCollection['features'][number]['geometry']][]): ModuleCollection => ({
  type: 'FeatureCollection',
  features: rows.map(([properties, geometry]) => ({ type: 'Feature', id: properties.id, geometry, properties })),
});
const ring = [[0, 0], [2, 0], [2, 4], [0, 0]];

describe('lugares de los módulos en la maqueta: solo registros reales', () => {
  it('cada punto real es un marcador con su id; los de ejemplo no se dibujan', () => {
    const layer = buildPlaceLayer('barberias', '✂️', collection([
      [item(1), { type: 'Point', coordinates: [1, 2] }],
      [item(2, { source_type: 'seed', verified: false }), { type: 'Point', coordinates: [5, 5] }],
      [item(3, { verified: false }), { type: 'Point', coordinates: [3, 4] }], // «por verificar» sí es real
    ]), project, { shapeMarkers: true });
    expect(Array.from(layer.markers)).toEqual([1000, Y, 2000, 3000, Y, 4000]);
    expect(layer.ids).toEqual([1, 3]);
    expect(layer.drawn).toBe(2);
    expect(layer.outline).toHaveLength(0);
  });

  it('las figuras dibujan su contorno y un marcador en el centro de su rectángulo', () => {
    const layer = buildPlaceLayer('zonas-verdes', '🌳', collection([
      [item(7), { type: 'Polygon', coordinates: [ring] }],
      [item(8), { type: 'LineString', coordinates: [[0, 0], [2, 2]] }],
    ]), project, { shapeMarkers: true });
    expect(layer.drawn).toBe(2);
    expect(layer.outline.length).toBe((3 + 1) * 6); // 3 segmentos del anillo y 1 de la línea
    expect(Array.from(layer.markers)).toEqual([1000, Y, 2000, 1000, Y, 1000]);
    expect(layer.ids).toEqual([7, 8]);
  });

  it('sin marcadores de figura (lotes fuera de su módulo) queda solo el contorno', () => {
    const layer = buildPlaceLayer('datos-catastrales', '🏠', collection([[item(9), { type: 'Polygon', coordinates: [ring] }]]),
      project, { shapeMarkers: false });
    expect(layer.markers).toHaveLength(0);
    expect(layer.drawn).toBe(1);
    expect(layer.outline.length).toBe(18);
  });

  it('un lugar sin geometría, o una figura de ejemplo, no se cuenta como dibujado', () => {
    const layer = buildPlaceLayer('escenarios-deportivos', '⚽', collection([
      [item(1), null],
      [item(2, { source_type: 'seed', verified: false }), { type: 'Polygon', coordinates: [ring] }],
    ]), project, { shapeMarkers: true });
    expect([layer.drawn, layer.markers.length, layer.outline.length]).toEqual([0, 0, 0]);
  });
});
