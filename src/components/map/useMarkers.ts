import { Marker, type Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import type { ModuleFeatures } from '../../lib/apiTypes';
import { labelOf } from '../../lib/moduleFields';
import { createEmojiMarker, setMarkerSelected } from './EmojiMarker';

interface Options {
  map: MapLibreMap | null;
  slug: string;
  features: ModuleFeatures | undefined;
  emoji: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
  reducedMotion: boolean;
}

/** Un marcador emoji por punto; el seleccionado se resalta y la cámara va hacia él. */
export function useMarkers({ map, slug, features, emoji, selectedId, onSelect, reducedMotion }: Options) {
  const markers = useRef(new Map<number, Marker>());
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const current = markers.current;
    if (!map || !features) return undefined;
    for (const feature of features.features) {
      if (feature.geometry?.type !== 'Point') continue;
      const { id, verified } = feature.properties;
      const element = createEmojiMarker(
        { emoji, label: labelOf(feature.properties, slug), verified },
        () => select.current(id),
      );
      const [lon, lat] = feature.geometry.coordinates as [number, number];
      current.set(id, new Marker({ element, anchor: 'center' }).setLngLat([lon, lat]).addTo(map));
    }
    return () => {
      current.forEach((marker) => marker.remove());
      current.clear();
    };
  }, [map, slug, features, emoji]);

  useEffect(() => {
    markers.current.forEach((marker, id) => setMarkerSelected(marker.getElement(), id === selectedId));
    const selected = selectedId === null ? undefined : markers.current.get(selectedId);
    if (!map || !selected) return;
    const center = selected.getLngLat();
    const zoom = Math.max(map.getZoom(), 16);
    if (reducedMotion) map.jumpTo({ center, zoom });
    else map.flyTo({ center, zoom, duration: 1000, essential: false });
  }, [map, selectedId, reducedMotion]);
}
