import './ribbon-grid.css';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { PhotoMeta } from './RibbonCaption';
import type { RibbonPhoto } from './ribbonPhotos';

/** La primera fila (hasta 3 columnas) entra sin diferir; la primera foto es el LCP de Galería (D116). */
const FIRST_ROW = 3;
// React 18 no conoce `fetchPriority`: va en minúsculas, como atributo HTML.
const HIGH = { fetchpriority: 'high' } as Record<string, string>;

interface RibbonGridProps {
  photos: readonly RibbonPhoto[];
  onOpen(index: number): void;
}

/**
 * Rejilla de respaldo de la cinta: las mismas fotos, en el mismo orden, con su etiqueta, su texto
 * alternativo y su crédito visibles. Es lo que se ve mientras llega el motor WebGL y lo que queda si
 * no hay WebGL. Cada foto es un botón cuyo nombre es su etiqueta real y su descripción, el texto
 * alternativo (así se distinguen las de un mismo lugar); abre el visor.
 */
export function RibbonGrid({ photos, onOpen }: RibbonGridProps) {
  const { t } = useTranslation();
  const ids = useId();
  return (
    <ul className="ribbon-grid" aria-label={t('galleryRibbon.label')}>
      {photos.map((photo, index) => (
        <li key={photo.key}>
          <figure className="ribbon-grid__figure">
            <button
              type="button" data-grid-index={index} onClick={() => onOpen(index)}
              aria-describedby={`${ids}-${index}`} className="ribbon-tile ui-pressable"
            >
              <img
                {...photo.thumb}
                {...(index === 0 ? HIGH : {})}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                alt=""
                loading={index < FIRST_ROW ? 'eager' : 'lazy'}
                decoding="async"
                className="ribbon-tile__img"
              />
              <span className="ribbon-tile__label">{photo.label}</span>
            </button>
            <figcaption className="ribbon-grid__caption">
              <span id={`${ids}-${index}`}>{photo.alt}</span>
              <PhotoMeta photo={photo} />
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
