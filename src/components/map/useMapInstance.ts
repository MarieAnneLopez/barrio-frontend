import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useEffect, useState, type RefObject } from 'react';
import { loadBaseMap } from './baseMapData';
import { buildBaseStyle } from './baseStyle';

// MapLibre 6 calcula la URL de su worker con import.meta.url en tiempo de ejecución;
// Vite no la ve al empaquetar. Se emite como asset (?url) y se declara (setWorkerUrl).
setWorkerUrl(workerUrl);

type Status = 'loading' | 'ready' | 'error';
// Margen de maxBounds (~4,4 km): con contenedores verticales, encuadrar el ancho de
// El Tintal muestra más latitud que el bbox; un margen menor obliga a recortar.
// Fuera del polígono no hay capas, así que el mapa sigue mostrando solo El Tintal (D5).
const PAD = 0.04;

/** Crea el mapa base de El Tintal (D5): bounds = bbox del polígono, sin teselas externas. */
export function useMapInstance(container: RefObject<HTMLDivElement | null>, attempt: number) {
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    let instance: MapLibreMap | null = null;
    loadBaseMap().then(
      (data) => {
        if (cancelled || !container.current) return;
        const [w, s, e, n] = data.polygon.bbox;
        instance = new MapLibreMap({
          container: container.current,
          style: buildBaseStyle(data),
          bounds: [w, s, e, n],
          fitBoundsOptions: { padding: 24 },
          maxBounds: [w - PAD, s - PAD, e + PAD, n + PAD],
          attributionControl: { compact: true, customAttribution: '© OpenStreetMap (ODbL)' },
          dragRotate: false,
        });
        instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
        instance.on('load', () => {
          if (cancelled || !instance) return;
          // El contenedor puede terminar de medirse después de crear el mapa (chunk
          // diferido, CSS): se reajusta y se vuelve a encuadrar todo El Tintal.
          instance.resize();
          instance.fitBounds([w, s, e, n], { padding: 24, animate: false });
          setMap(instance);
          setStatus('ready');
        });
      },
      () => {
        if (!cancelled) setStatus('error');
      },
    );
    return () => {
      cancelled = true;
      instance?.remove();
      setMap(null);
      setStatus('loading');
    };
  }, [container, attempt]);

  return { map, status };
}
