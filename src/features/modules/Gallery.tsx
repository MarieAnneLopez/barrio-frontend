import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import type { Photo } from '../../lib/apiTypes';
import { photoAlt, photoSet } from '../../lib/photoUrls';
import { GalleryLightbox } from './GalleryLightbox';

/** Miniaturas de las fotos locales del lugar; cada una abre el visor. */
export function Gallery({ slug, itemId, place }: { slug: string; itemId: number; place: string }) {
  const { t, i18n } = useTranslation();
  const photos = useApi<Photo[]>(`/${slug}/${itemId}/fotos`);
  const [open, setOpen] = useState<number | null>(null);
  const list = photos.status === 'success' ? photos.data : [];

  return (
    <section aria-label={t('gallery.title')} className="flex flex-col gap-3 border-t border-line pt-4">
      <h3 className="m-0 text-step-0 text-fg">{t('gallery.title')}</h3>
      {photos.status === 'success' && !list.length ? (
        <p className="m-0 text-step--1 text-fg-secondary">{t('gallery.empty')}</p>
      ) : null}
      {list.length ? (
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
          {list.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setOpen(index)}
                className="ui-pressable block w-full overflow-hidden rounded-md border border-line"
              >
                <img {...photoSet(photo.url)} sizes="160px" alt={photoAlt(photo, i18n.language)} loading="lazy" className="aspect-square w-full object-cover" />
                <span className="sr-only">{t('gallery.open', { place })}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <GalleryLightbox photos={list} index={open} onIndex={setOpen} place={place} />
    </section>
  );
}
