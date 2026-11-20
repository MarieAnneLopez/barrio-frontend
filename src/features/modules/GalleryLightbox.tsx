import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { Photo } from '../../lib/apiTypes';
import { photoAlt, photoSet } from '../../lib/photoUrls';
import { PhotoCredit } from '../gallery/PhotoCredit';
import { usePhotoTransition, type Thumbnail } from '../gallery/usePhotoTransition';

/** Ancho de la foto: el panel ancho del modal (48rem) menos su margen interior y el de la pantalla. */
const SIZES = '(min-width: 800px) 720px, calc(100vw - 80px)';

interface GalleryLightboxProps {
  photos: Photo[];
  /** Foto abierta; null = cerrado. */
  index: number | null;
  onIndex: (index: number | null) => void;
  place: string;
  thumbnail?: Thumbnail;
}

/**
 * Visor (§11.3 punto 4): entra con el modal (escala + opacidad), flechas
 * izquierda/derecha o botones para navegar, Escape cierra, pie con autor y licencia.
 * Las fotos de Commons tienen versión de 640 y 1280 px y el navegador pide la de su ancho; las de
 * Mapillary existen solo a 1024 px y van tal cual (photoSet). Se decodifican fuera del hilo principal.
 */
export function GalleryLightbox({ photos, index, onIndex, place, thumbnail }: GalleryLightboxProps) {
  const { t, i18n } = useTranslation();
  const total = photos.length;
  const photo = index === null ? undefined : photos[index];
  const image = useRef<HTMLImageElement>(null);
  const close = usePhotoTransition(image, index, thumbnail, () => onIndex(null));
  const go = (step: number) => index !== null && onIndex((index + step + total) % total);

  useEffect(() => {
    if (index === null || total < 2) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') onIndex((index + 1) % total);
      if (event.key === 'ArrowLeft') onIndex((index - 1 + total) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, total, onIndex]);

  return (
    <Modal open={photo !== undefined} onClose={close} title={place} wide>
      {photo ? (
        <figure className="m-0 flex flex-col gap-3">
          <img
            ref={image} key={photo.id} {...photoSet(photo.url)} sizes={SIZES} decoding="async" alt={photoAlt(photo, i18n.language)}
            className="ui-lightbox-img max-h-[60dvh] w-full rounded-md object-contain"
          />
          <figcaption className="text-step--1 text-fg-secondary">
            {photoAlt(photo, i18n.language)}
            <PhotoCredit author={photo.autor} license={photo.licencia} source={photo.source_ref} />
          </figcaption>
          {total > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Button variant="secondary" size="sm" onClick={() => go(-1)}>{t('gallery.previous')}</Button>
              <span className="font-mono text-step--1 text-fg-muted" aria-live="polite">
                {t('gallery.position', { current: (index ?? 0) + 1, total })}
              </span>
              <Button variant="secondary" size="sm" onClick={() => go(1)}>{t('gallery.next')}</Button>
            </div>
          ) : null}
        </figure>
      ) : null}
    </Modal>
  );
}
