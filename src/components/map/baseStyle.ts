// Estilo del mapa base local (D5): solo El Tintal, en la paleta del design system.
// Sin teselas externas ni fuentes remotas: todas las capas son GeoJSON de la API.
import type { MapOptions } from 'maplibre-gl';
import { paletteColor } from '../../lib/cssToken';
import type { BaseMapData } from './baseMapData';

type StyleSpec = Exclude<NonNullable<MapOptions['style']>, string>;
type LayerSpec = StyleSpec['layers'][number];

const MAJOR_ROADS = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];

function layers(): LayerSpec[] {
  // §9 de DISENO-V2: suelo piedra, manzanas vino, parques rosa, vías blancas, borde ladrillo.
  const piedra = paletteColor('piedra');
  const vino = paletteColor('vino');
  const rosa = paletteColor('rosa');
  const ladrillo = paletteColor('ladrillo');
  const blanco = '#ffffff';
  return [
    { id: 'fondo', type: 'background', paint: { 'background-color': vino } },
    { id: 'tintal-area', type: 'fill', source: 'tintal', paint: { 'fill-color': piedra, 'fill-opacity': 1 } },
    { id: 'manzanas', type: 'fill', source: 'manzanas', paint: { 'fill-color': vino, 'fill-opacity': 0.7, 'fill-outline-color': vino } },
    { id: 'parques', type: 'fill', source: 'parques', paint: { 'fill-color': rosa, 'fill-opacity': 0.6 } },
    { id: 'edificios', type: 'fill', source: 'edificios', paint: { 'fill-color': ladrillo, 'fill-opacity': 0.75 } },
    {
      id: 'vias',
      type: 'line',
      source: 'vias',
      paint: {
        'line-color': blanco,
        'line-opacity': ['match', ['get', 'kind'], MAJOR_ROADS, 0.95, 0.7],
        'line-width': ['match', ['get', 'kind'], MAJOR_ROADS, 2.4, 0.8],
      },
    },
    {
      id: 'tintal-borde',
      type: 'line',
      source: 'tintal',
      paint: { 'line-color': ladrillo, 'line-width': 3, 'line-dasharray': [2, 1.5] },
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
