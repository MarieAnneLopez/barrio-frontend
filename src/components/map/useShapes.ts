import type { ExpressionSpecification, Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import type { ModuleFeatures } from '../../lib/apiTypes';
import { paletteColor } from '../../lib/cssToken';
import { geometryBounds } from './geometryBounds';
import { isMapAlive, removeLayersAndSource } from './mapCleanup';

export const SHAPES_SOURCE = 'modulo-figuras';
export const FILL_LAYER = 'modulo-relleno';
export const LINE_LAYER = 'modulo-borde';

interface Options {
  map: MapLibreMap | null;
  features: ModuleFeatures | undefined;
  selectedId: number | null;
  onSelect: (id: number) => void;
  reducedMotion: boolean;
}

const selected: ExpressionSpecification = ['boolean', ['feature-state', 'selected'], false];

/** Polígonos y líneas del módulo (zonas, lotes, calles): clic = seleccionar; la cámara encuadra. */
export function useShapes({ map, features, selectedId, onSelect, reducedMotion }: Options) {
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!map || !features) return undefined;
    const shapes = features.features.filter((f) => f.geometry && f.geometry.type !== 'Point');
    if (!shapes.length) return undefined;
    const fill = paletteColor('ladrillo');
    const edge = paletteColor('vino');
    map.addSource(SHAPES_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: shapes } });
    map.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: SHAPES_SOURCE,
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      paint: { 'fill-color': fill, 'fill-opacity': ['case', selected, 0.6, 0.28] },
    });
    map.addLayer({
      id: LINE_LAYER, type: 'line', source: SHAPES_SOURCE,
      paint: { 'line-color': ['case', selected, edge, fill], 'line-width': ['case', selected, 4, 2] },
    });
    const click = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.id;
      if (typeof id === 'number') select.current(id);
    };
    const pointer = () => (map.getCanvas().style.cursor = 'pointer');
    const reset = () => (map.getCanvas().style.cursor = '');
    for (const layer of [FILL_LAYER, LINE_LAYER]) {
      map.on('click', layer, click);
      map.on('mouseenter', layer, pointer);
      map.on('mouseleave', layer, reset);
    }
    return () => {
      for (const layer of [FILL_LAYER, LINE_LAYER]) {
        map.off('click', layer, click);
        map.off('mouseenter', layer, pointer);
        map.off('mouseleave', layer, reset);
      }
      removeLayersAndSource(map, [FILL_LAYER, LINE_LAYER], SHAPES_SOURCE);
    };
  }, [map, features]);

  useEffect(() => {
    if (!map || !features) return undefined;
    const target = features.features.find((f) => f.id === selectedId && f.geometry?.type !== 'Point');
    if (!target?.geometry) return undefined;
    map.setFeatureState({ source: SHAPES_SOURCE, id: selectedId as number }, { selected: true });
    const bounds = geometryBounds(target.geometry);
    if (bounds) map.fitBounds(bounds, { padding: 48, maxZoom: 18, animate: !reducedMotion });
    return () => {
      if (isMapAlive(map) && map.getSource(SHAPES_SOURCE)) {
        map.setFeatureState({ source: SHAPES_SOURCE, id: selectedId as number }, { selected: false });
      }
    };
  }, [map, features, selectedId, reducedMotion]);
}
