import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadError } from '../../components/ui/LoadError';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAllPhotos } from '../../hooks/useAllPhotos';
import { PageHeader } from '../pages/PageHeader';
import { PhotoRibbon } from './ribbon/PhotoRibbon';
import { ribbonPhotos } from './ribbon/ribbonPhotos';

/**
 * Galería General (D66): fotos reales de los lugares y vistas del barrio, todas en la cinta curva
 * (o en su rejilla de respaldo), con su autor y su licencia en el visor. La única animación de
 * entrada es la de la sección (D101); la «ola» de ScrollTrigger (H32) se fue con las listas.
 */
export function GalleryPage() {
  const { t, i18n } = useTranslation();
  const photos = useAllPhotos(); // H35: con Mapillary son más de 100
  const list = photos.items;
  const items = useMemo(() => ribbonPhotos(list, t, i18n.language), [list, t, i18n.language]);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t('nav.gallery')} description={t('pages.gallery')} />
      <p className="ui-prose m-0 text-step-0">{t('galleryPage.note')}</p>
      <section aria-labelledby="gallery-photos" className="flex flex-col gap-6">
        <h2 id="gallery-photos" className="m-0 text-step-2 text-fg">{t('galleryPage.photos')}</h2>
        {photos.status === 'loading' ? <Skeleton className="h-48 w-full" lines={3} /> : null}
        {photos.status === 'error' ? <LoadError onRetry={photos.retry} /> : null}
        {photos.status === 'success' && !list.length ? (
          <p className="m-0 text-fg-secondary">{t('galleryPage.empty')}</p>
        ) : null}
        {/* Al reintentar se pasa por «loading»: la cinta se desmonta y vuelve con las fotos nuevas. */}
        {photos.status === 'loading' ? null : <PhotoRibbon photos={items} />}
      </section>
    </div>
  );
}
