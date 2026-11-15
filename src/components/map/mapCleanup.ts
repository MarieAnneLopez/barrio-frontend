import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * El mapa sigue utilizable: maplibre-gl deja `style` en null al destruirse con
 * remove() o al perder el contexto WebGL, y desde ahí removeSource falla (H31, D67).
 */
export function isMapAlive(map: MapLibreMap): boolean {
  return Boolean(map.style);
}

/** Quita capas y después su fuente, solo si el mapa, el estilo y cada pieza existen. */
export function removeLayersAndSource(map: MapLibreMap, layers: readonly string[], source: string): void {
  if (!isMapAlive(map)) return;
  for (const layer of layers) {
    if (map.getLayer(layer)) map.removeLayer(layer);
  }
  if (map.getSource(source)) map.removeSource(source);
}
