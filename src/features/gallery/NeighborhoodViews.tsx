import { useTranslation } from 'react-i18next';
import { photoSources, type CarouselPhoto } from '../home/carouselPhotos';
import { PhotoCredit } from './PhotoCredit';

/** Vistas generales del barrio (fotos del carrusel que no pertenecen a un lugar del mapa). */
export function NeighborhoodViews({ photos }: { photos: CarouselPhoto[] }) {
  const { t } = useTranslation();
  if (!photos.length) return null;
  return (
    <section aria-labelledby="gallery-views" className="flex flex-col gap-4">
      <h2 id="gallery-views" className="m-0 text-step-2 text-fg">{t('galleryPage.views')}</h2>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <li key={photo.id} data-reveal>
            <figure className="m-0 flex flex-col gap-2">
              <img
                {...photoSources(photo.id)}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                width={photo.width}
                height={photo.height}
                alt={t(`carousel.photos.${photo.id}.alt`)}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full rounded-sm object-cover"
              />
              <figcaption className="flex flex-col gap-1">
                <span className="text-step--1 text-fg">{t(`carousel.photos.${photo.id}.caption`)}</span>
                <PhotoCredit author={photo.author} license={photo.license} source={photo.source} />
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
