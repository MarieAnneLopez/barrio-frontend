import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { loadBaseMap } from './baseMapData';
import { buildBaseStyle } from './baseStyle';
import { RecenterControl } from './RecenterControl';
import { useLoadingStore } from '../../store/loadingStore';

// MapLibre 6 calcula la URL de su worker con import.meta.url en tiempo de ejecución;
// Vite no la ve al empaquetar. Se emite como asset (?url) y se declara (setWorkerUrl).
setWorkerUrl(workerUrl);

type Status = 'loading' | 'ready' | 'error';
// Margen de maxBounds (~4,4 km): con contenedores verticales, encuadrar el ancho de
// El Tintal muestra más latitud que el bbox; un margen menor obliga a recortar.
// Fuera del polígono no hay capas, así que el mapa sigue mostrando solo El Tintal (D5).
const PAD = 0.04;

/** Textos del mapa en el idioma activo y preferencia de movimiento (H34). */
export interface MapUiOptions {
  recenter: string;
  gestures: { windows: string; mac: string; mobile: string };
  reducedMotion: boolean;
}

/** Crea el mapa base de El Tintal (D5): bounds = bbox del polígono, sin teselas externas. */
export function useMapInstance(
  container: RefObject<HTMLDivElement | null>,
  attempt: number,
  ui: MapUiOptions,
) {
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const uiRef = useRef(ui);
  useEffect(() => {
    uiRef.current = ui;
  });

  useEffect(() => {
    let cancelled = false;
    let instance: MapLibreMap | null = null;
    // Etapa real para la LoadingRunnerBar: estilo y capas del mapa hasta su evento 'load'.
    const loading = useLoadingStore.getState();
    let task: number | null = null;
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
          // Táctil: dos dedos mueven el mapa y uno sigue desplazando la página (no atrapa el
          // scroll). Con ratón: arrastre y rueda libres, sin teclas extra.
          cooperativeGestures: window.matchMedia?.('(pointer: coarse)').matches ?? false,
          locale: {
            'CooperativeGesturesHandler.WindowsHelpText': uiRef.current.gestures.windows,
            'CooperativeGesturesHandler.MacHelpText': uiRef.current.gestures.mac,
            'CooperativeGesturesHandler.MobileHelpText': uiRef.current.gestures.mobile,
          },
        });
        instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
        instance.addControl(
          new RecenterControl([w, s, e, n], uiRef.current.recenter, () => !uiRef.current.reducedMotion),
          'top-right',
        );
        task = loading.begin();
        loading.update(task, 0.5);
        instance.on('load', () => {
          if (task !== null) loading.end(task);
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
      if (task !== null) loading.end(task);
      instance?.remove();
      setMap(null);
      setStatus('loading');
    };
  }, [container, attempt]);

  return { map, status };
}
