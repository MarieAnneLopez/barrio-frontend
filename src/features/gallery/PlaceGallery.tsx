import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../lib/categoryConfig';
import { photoAlt, photoSet } from '../../lib/photoUrls';
import { GalleryLightbox } from '../modules/GalleryLightbox';
import type { PlaceGroup } from './groupPhotos';
import { PhotoCredit } from './PhotoCredit';

/** Fotos de un lugar: miniaturas con crédito visible, visor y enlace a su módulo. */
export function PlaceGallery({ group }: { group: PlaceGroup }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState<number | null>(null);
  const emoji = CATEGORIES.find((c) => c.slug === group.slug)?.emoji;
  const module = t(`categories.${group.slug}.name`);

  return (
    <section aria-labelledby={`place-${group.key}`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`place-${group.key}`} className="m-0 text-step-1 text-fg">{group.name}</h3>
        <Link to={`/categorias/${group.slug}`} className="text-step--1 text-accent underline underline-offset-4">
          {emoji ? <span aria-hidden="true">{emoji} </span> : null}
          {t('galleryPage.module', { module })}
        </Link>
      </div>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {group.photos.map((photo, index) => (
          <li key={photo.id} data-reveal>
            <figure className="m-0 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setOpen(index)}
                className="ui-pressable block w-full overflow-hidden rounded-sm"
              >
                <img
                  {...photoSet(photo.url)}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  alt={photoAlt(photo, i18n.language)}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="sr-only">{t('gallery.open', { place: group.name })}</span>
              </button>
              <figcaption className="flex flex-col gap-1">
                <span className="text-step--1 text-fg">{photoAlt(photo, i18n.language)}</span>
                <PhotoCredit author={photo.autor} license={photo.licencia} source={photo.source_ref} />
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <GalleryLightbox photos={group.photos} index={open} onIndex={setOpen} place={group.name} />
    </section>
  );
}
