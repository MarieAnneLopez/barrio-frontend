import { useTranslation } from 'react-i18next';
import { CAROUSEL_PHOTOS } from '../home/carouselPhotos';
import { PhotoCredit } from './PhotoCredit';

// Misma fila de registro que las fotos de los lugares (Paleta D100: el lugar en una celda rosa claro).
const ROW = 'grid gap-x-6 gap-y-2 border-b border-line pb-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]';

/**
 * Las vistas del barrio del carrusel (vuelo entre fotos del Inicio y Galería): son locales (no
 * vienen de la API), así que se acreditan aquí, con su autor, su licencia y su página de origen.
 */
export function CarouselCredits() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="credits-views" className="flex flex-col gap-3 border-t border-line pt-4">
      <h2 id="credits-views" className="m-0 text-step-2 text-fg">
        {t('carousel.creditsHeading')}
      </h2>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {CAROUSEL_PHOTOS.map((photo) => (
          <li key={photo.id} className={ROW}>
            <div className="tone-papel rounded-sm bg-pink px-4 py-2 text-step-0 text-fg">
              {t(`carousel.photos.${photo.id}.caption`)}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-step--1 text-fg-secondary">{t(`carousel.photos.${photo.id}.alt`)}</span>
              <PhotoCredit author={photo.author} license={photo.license} source={photo.source} badges />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
