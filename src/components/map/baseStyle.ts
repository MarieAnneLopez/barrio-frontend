// Estilo del mapa base local (D5): solo El Tintal, en la paleta del design system.
// Sin teselas externas ni fuentes remotas: todas las capas son GeoJSON de la API.
import type { MapOptions } from 'maplibre-gl';
import { paletteColor } from '../../lib/cssToken';
import type { BaseMapData } from './baseMapData';

type StyleSpec = Exclude<NonNullable<MapOptions['style']>, string>;
type LayerSpec = StyleSpec['layers'][number];

const MAJOR_ROADS = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];

function layers(): LayerSpec[] {
  const ink = paletteColor('ink');
  const navy = paletteColor('navy');
  const sky = paletteColor('sky');
  const cobalt = paletteColor('cobalt');
  const azure = paletteColor('azure');
  return [
    { id: 'fondo', type: 'background', paint: { 'background-color': ink } },
    { id: 'tintal-area', type: 'fill', source: 'tintal', paint: { 'fill-color': navy, 'fill-opacity': 0.55 } },
    { id: 'manzanas', type: 'fill', source: 'manzanas', paint: { 'fill-color': navy, 'fill-outline-color': sky } },
    { id: 'parques', type: 'fill', source: 'parques', paint: { 'fill-color': azure, 'fill-opacity': 0.16 } },
    { id: 'edificios', type: 'fill', source: 'edificios', paint: { 'fill-color': cobalt, 'fill-opacity': 0.55 } },
    {
      id: 'vias',
      type: 'line',
      source: 'vias',
      paint: {
        'line-color': sky,
        'line-opacity': ['match', ['get', 'kind'], MAJOR_ROADS, 0.55, 0.22],
        'line-width': ['match', ['get', 'kind'], MAJOR_ROADS, 2.4, 0.8],
      },
    },
    {
      id: 'tintal-borde',
      type: 'line',
      source: 'tintal',
      paint: { 'line-color': sky, 'line-width': 2, 'line-dasharray': [2, 1.5] },
    },
  ];
}

export function buildBaseStyle(data: BaseMapData): StyleSpec {
  const geojson = (value: unknown) => ({ type: 'geojson' as const, data: value as never });
  return {
    version: 8,
    sources: {
      tintal: geojson(data.polygon),
      manzanas: geojson(data.layers.manzanas),
      parques: geojson(data.layers.parques),
      edificios: geojson(data.layers.edificios),
      vias: geojson(data.layers.vias),
    },
    layers: layers(),
  };
}
