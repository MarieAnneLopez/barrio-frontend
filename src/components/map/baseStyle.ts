// Estilo del mapa base local (D5): solo El Tintal, en los verdes propios del mapa (D82).
// Sin teselas externas ni fuentes remotas: todas las capas son GeoJSON de la API.
import type { ExpressionSpecification, MapOptions } from 'maplibre-gl';
import { mapColor } from '../../lib/cssToken';
import type { BaseMapData } from './baseMapData';

type StyleSpec = Exclude<NonNullable<MapOptions['style']>, string>;
type LayerSpec = StyleSpec['layers'][number];

const MAJOR_ROADS = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];

function layers(): LayerSpec[] {
  // D82 (pedido de Marie): dentro del mapa todo es verde y claro (suelo niebla, manzanas brote,
  // edificios follaje, parques menta, vías blancas con borde follaje) para que la capa del
  // módulo, verde bosque con borde blanco, resalte. Paleta propia (styles/map-palette.css).
  const via = mapColor('via');
  const follaje = mapColor('follaje');
  const width = (major: number, minor: number): ExpressionSpecification =>
    ['match', ['get', 'kind'], MAJOR_ROADS, major, minor];
  return [
    { id: 'fondo', type: 'background', paint: { 'background-color': mapColor('fondo') } },
    { id: 'tintal-area', type: 'fill', source: 'tintal', paint: { 'fill-color': mapColor('niebla'), 'fill-opacity': 1 } },
    { id: 'manzanas', type: 'fill', source: 'manzanas', paint: { 'fill-color': mapColor('brote'), 'fill-outline-color': follaje } },
    { id: 'parques', type: 'fill', source: 'parques', paint: { 'fill-color': mapColor('menta'), 'fill-opacity': 0.85 } },
    { id: 'edificios', type: 'fill', source: 'edificios', paint: { 'fill-color': follaje, 'fill-opacity': 0.9 } },
    { id: 'vias-borde', type: 'line', source: 'vias', paint: { 'line-color': follaje, 'line-width': width(4, 2) } },
    { id: 'vias', type: 'line', source: 'vias', paint: { 'line-color': via, 'line-width': width(2.4, 0.9) } },
    {
      id: 'tintal-borde',
      type: 'line',
      source: 'tintal',
      paint: { 'line-color': mapColor('hoja'), 'line-width': 3, 'line-dasharray': [2, 1.5] },
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
