// Estilo del mapa base local (D5): solo El Tintal, con el tema único de los mapas (D83).
// Sin teselas externas ni fuentes remotas: todas las capas son GeoJSON de la API.
import type { ExpressionSpecification, MapOptions } from 'maplibre-gl';
import { mapColor } from '../../lib/cssToken';
import type { BaseMapData } from './baseMapData';

type StyleSpec = Exclude<NonNullable<MapOptions['style']>, string>;
type LayerSpec = StyleSpec['layers'][number];

const MAJOR_ROADS = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];

function layers(): LayerSpec[] {
  // D83: los mismos hex del tema que la maqueta 3D (styles/map-palette.css), sin opacidades para
  // que el color no se mezcle: suelo, manzanas, parques, vías con borde, edificios por altura y
  // el límite del barrio. La capa del módulo va encima en el color de contorno.
  const width = (major: number, minor: number): ExpressionSpecification =>
    ['match', ['get', 'kind'], MAJOR_ROADS, major, minor];
  const byHeight: ExpressionSpecification = ['step', ['to-number', ['get', 'levels']],
    mapColor('edificio-bajo'), 4, mapColor('edificio-medio'), 7, mapColor('edificio-alto')];
  return [
    { id: 'fondo', type: 'background', paint: { 'background-color': mapColor('fondo') } },
    { id: 'tintal-area', type: 'fill', source: 'tintal', paint: { 'fill-color': mapColor('suelo') } },
    { id: 'manzanas', type: 'fill', source: 'manzanas', paint: { 'fill-color': mapColor('manzana'), 'fill-outline-color': mapColor('sombra') } },
    { id: 'parques', type: 'fill', source: 'parques', paint: { 'fill-color': mapColor('parque') } },
    { id: 'vias-borde', type: 'line', source: 'vias', paint: { 'line-color': mapColor('via-borde'), 'line-width': width(4, 2) } },
    { id: 'vias', type: 'line', source: 'vias', paint: { 'line-color': mapColor('via'), 'line-width': width(2.4, 0.9) } },
    { id: 'edificios', type: 'fill', source: 'edificios', paint: { 'fill-color': byHeight, 'fill-outline-color': mapColor('contorno') } },
    {
      id: 'tintal-borde',
      type: 'line',
      source: 'tintal',
      paint: { 'line-color': mapColor('limite'), 'line-width': 3, 'line-dasharray': [2, 1.5] },
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
