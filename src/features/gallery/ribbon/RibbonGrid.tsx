import './ribbon-grid.css';
import { useTranslation } from 'react-i18next';
import { PhotoCredit } from '../PhotoCredit';
import type { RibbonPhoto } from './ribbonPhotos';

interface RibbonGridProps {
  photos: readonly RibbonPhoto[];
  onOpen(index: number): void;
}

/**
 * Rejilla de respaldo de la cinta: las mismas fotos, en el mismo orden, con su etiqueta, su texto
 * alternativo y su crédito visibles. Es lo que se ve mientras llega el motor WebGL y lo que queda si
 * no hay WebGL. Cada foto es un botón cuyo nombre es su etiqueta real; abre el visor.
 */
export function RibbonGrid({ photos, onOpen }: RibbonGridProps) {
  const { t } = useTranslation();
  return (
    <ul className="ribbon-grid" aria-label={t('galleryRibbon.label')}>
      {photos.map((photo, index) => (
        <li key={photo.key}>
          <figure className="ribbon-grid__figure">
            <button type="button" data-grid-index={index} onClick={() => onOpen(index)} className="ribbon-tile ui-pressable">
              <img
                {...photo.thumb}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                alt=""
                loading="lazy"
                decoding="async"
                className="ribbon-tile__img"
              />
              <span className="ribbon-tile__label">{photo.label}</span>
            </button>
            <figcaption className="ribbon-grid__caption">
              <span>{photo.alt}</span>
              <PhotoCredit author={photo.photo.autor} license={photo.photo.licencia} source={photo.photo.source_ref} />
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
