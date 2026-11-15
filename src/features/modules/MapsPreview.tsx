import './maps-preview.css';
import type { FeatureCollection, Geometry } from 'geojson';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadBaseMap, type BaseMapData } from '../../components/map/baseMapData';
import { mapsSearchUrl, placeCenter, streetViewUrl } from '../../lib/googleMapsUrls';
import { pathOf, project, VIEW, windowAround } from './previewSvg';

interface Props {
  place: string;
  geometry: Geometry | null;
}

/**
 * Vista previa del lugar que lleva a Google Maps (pedido de Marie): el dibujo es el mapa
 * propio de la plataforma (OpenStreetMap), no una imagen de Google; el clic abre Google
 * Maps en una pestaña nueva y un segundo enlace abre Street View en ese punto.
 */
export function MapsPreview({ place, geometry }: Props) {
  const { t } = useTranslation();
  const [base, setBase] = useState<BaseMapData | null>(null);
  const center = placeCenter(geometry);

  useEffect(() => {
    let alive = true;
    loadBaseMap().then((data) => alive && setBase(data), () => undefined); // sin base: solo el punto
    return () => {
      alive = false;
    };
  }, []);

  if (!center) return null;
  const w = windowAround(center);
  const [cx, cy] = project(w, [center.lon, center.lat]);
  const own: FeatureCollection | undefined = geometry
    ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry, properties: {} }] }
    : undefined;
  const area = geometry?.type.includes('Polygon') ?? false;
  const draw = (fc: FeatureCollection | undefined, closed: boolean) => (fc ? pathOf(w, fc, closed) : '');

  return (
    <section aria-label={t('modules.maps.section')} className="flex flex-col gap-2">
      <a
        href={mapsSearchUrl(center)}
        target="_blank"
        rel="noopener noreferrer"
        className="maps-preview px-corners"
      >
        <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" className="block h-auto w-full">
          <rect width={VIEW.width} height={VIEW.height} className="maps-preview__ground" />
          <path d={draw(base?.layers.parques, true)} className="maps-preview__parks" />
          <path d={draw(base?.layers.manzanas, true)} className="maps-preview__blocks" />
          <path d={draw(base?.layers.vias, false)} className="maps-preview__roads" />
          <path d={draw(own, area)} className="maps-preview__place" />
          <rect x={cx - 6} y={cy - 6} width={12} height={12} className="maps-preview__pin" />
        </svg>
        <span className="maps-preview__label">
          {t('modules.maps.cta')} ↗<span className="sr-only">: {place} {t('modules.maps.newTab')}</span>
        </span>
      </a>
      <p className="m-0 flex flex-wrap items-center gap-x-3 text-step--2 text-fg-muted">
        <a href={streetViewUrl(center)} target="_blank" rel="noopener noreferrer" className="text-fg underline">
          {t('modules.maps.streetView')} ↗<span className="sr-only"> {t('modules.maps.newTab')}</span>
        </a>
        <span>{t('modules.maps.attribution')}</span>
      </p>
    </section>
  );
}
