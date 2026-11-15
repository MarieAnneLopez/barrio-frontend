import { describe, expect, it } from 'vitest';
import type { ModuleItem } from '../lib/apiTypes';
import { buildCategoryLayer, type ModuleCollection } from './categoryLayers';

const project = ([lon = 0, lat = 0]: readonly number[]): [number, number] => [lon * 1000, lat * 1000];
const props = (id: number): ModuleItem => ({
  id, nombre: `Lugar ${id}`, source_type: 'osm', source_ref: null, verified: true, geometry: null,
});
const collection = (geoms: (ModuleCollection['features'][number]['geometry'])[]): ModuleCollection => ({
  type: 'FeatureCollection',
  features: geoms.map((geometry, i) => ({ type: 'Feature', id: i + 1, geometry, properties: props(i + 1) })),
});

describe('Capas de la maqueta (H34): cada lugar con geometría se dibuja una vez', () => {
  it('puntos: un vértice por lugar, con su nombre para la ficha', () => {
    const layer = buildCategoryLayer('barberias', '💈', collection([
      { type: 'Point', coordinates: [1, 2] }, { type: 'Point', coordinates: [3, 4] },
    ]), project);
    expect(layer.kind).toBe('points');
    expect(layer.drawn).toBe(2);
    expect(Array.from(layer.positions)).toEqual([1000, 46, 2000, 3000, 46, 4000]);
    expect(layer.items).toEqual([{ id: 1, name: 'Lugar 1' }, { id: 2, name: 'Lugar 2' }]);
  });

  it('polígonos, multipolígonos y líneas cuentan un lugar cada uno', () => {
    const ring = [[0, 0], [1, 0], [1, 1], [0, 0]];
    const layer = buildCategoryLayer('zonas-verdes', '🌳', collection([
      { type: 'Polygon', coordinates: [ring] },
      { type: 'MultiPolygon', coordinates: [[ring], [ring]] },
      { type: 'LineString', coordinates: [[0, 0], [2, 2]] },
    ]), project);
    expect(layer.kind).toBe('shapes');
    expect(layer.drawn).toBe(3);
    // 3 + 6 segmentos de los anillos y 1 de la línea, con 2 extremos de 3 coordenadas.
    expect(layer.positions.length).toBe((3 + 6 + 1) * 6);
  });

  it('un lugar sin geometría no se cuenta como dibujado', () => {
    const layer = buildCategoryLayer('robos', '🚨', collection([
      { type: 'Point', coordinates: [1, 1] }, null,
    ]), project);
    expect(layer.drawn).toBe(1);
  });
});
