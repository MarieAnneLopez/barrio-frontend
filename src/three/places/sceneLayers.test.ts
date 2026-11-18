import { describe, expect, it } from 'vitest';
import type { ModuleItem } from '../../lib/apiTypes';
import type { ModuleCollection } from './placeLayers';
import { sceneLayers } from './sceneLayers';

const project = ([lon = 0, lat = 0]: readonly number[]): [number, number] => [lon, lat];
const ring = [[0, 0], [2, 0], [2, 2], [0, 0]];
const item = (id: number): ModuleItem => ({ id, source_type: 'osm', source_ref: null, verified: true, geometry: null });
const polygons = (...ids: number[]): ModuleCollection => ({
  type: 'FeatureCollection',
  features: ids.map((id) => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: item(id) })),
});
const PLACES = [
  { slug: 'zonas-verdes', emoji: '🌳', collection: polygons(1, 2) },
  { slug: 'datos-catastrales', emoji: '🏠', collection: polygons(3) },
  { slug: 'estado-calles', emoji: '🛣️', collection: polygons(7) },
  { slug: 'localidad', emoji: '🏛️', collection: polygons(4) },
  { slug: 'barberias', emoji: '✂️', collection: null }, // la API de ese módulo falló
];
const ALL = { slug: null, collection: null };

describe('qué módulos dibuja la maqueta', () => {
  it('en el Inicio y en Mapa 3D, todos los que tienen datos; lotes y calles, sin marcadores', () => {
    const layers = sceneLayers(PLACES, ALL, project);
    expect(layers.map((l) => [l.slug, l.ids])).toEqual([
      ['zonas-verdes', [1, 2]], ['datos-catastrales', []], ['estado-calles', []], ['localidad', []],
    ]);
    expect(layers.map((l) => l.drawn)).toEqual([2, 1, 1, 0]);
    expect(layers.every((l) => l.shapes === null)).toBe(true); // fuera de su sección, lotes y calles no se eligen
  });

  it('la localidad es una ficha de toda la zona: no se dibuja (su contorno salía de la isla al cielo)', () => {
    const outside = sceneLayers(PLACES, ALL, project).find((l) => l.slug === 'localidad');
    const own = sceneLayers(PLACES, { slug: 'localidad', collection: polygons(4) }, project)[0];
    for (const layer of [outside, own]) {
      expect([layer?.outline.length, layer?.markers.length, layer?.drawn, layer?.shapes]).toEqual([0, 0, 0, null]);
    }
  });

  it('dentro de un módulo, solo los suyos y con la búsqueda y los filtros de su lista', () => {
    const layers = sceneLayers(PLACES, { slug: 'zonas-verdes', collection: polygons(5, 6) }, project);
    expect(layers.map((l) => [l.slug, l.emoji, l.ids])).toEqual([['zonas-verdes', '🌳', [5, 6]]]);
    expect(layers[0]?.shapes).toBeNull();
  });

  it('en la sección de lotes o de calles no hay un marcador por figura (una alfombra): se eligen en el suelo', () => {
    for (const slug of ['datos-catastrales', 'estado-calles']) {
      const [layer] = sceneLayers(PLACES, { slug, collection: polygons(5, 6) }, project);
      expect(layer?.ids).toEqual([]);
      expect(layer?.markers).toHaveLength(0);
      expect(layer?.shapes?.ids).toEqual([5, 6]);
      expect(layer?.drawn).toBe(2);
    }
  });

  it('mientras la lista del módulo carga, usa los lugares que ya tiene la maqueta', () => {
    const layers = sceneLayers(PLACES, { slug: 'zonas-verdes', collection: null }, project);
    expect(layers.map((l) => l.ids)).toEqual([[1, 2]]);
    expect(sceneLayers(null, { slug: 'barberias', collection: null }, project)).toEqual([]);
  });
});
