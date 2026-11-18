import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAllPhotos } from '../../hooks/useAllPhotos';
import { useBatchReveal } from '../../hooks/useBatchReveal';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PageHeader } from '../pages/PageHeader';
import { PhotoRibbon } from './ribbon/PhotoRibbon';
import { ribbonPhotos } from './ribbon/ribbonPhotos';

/**
 * Galería General (D66): fotos reales de los lugares y vistas del barrio, todas en la cinta curva
 * (o en su rejilla de respaldo), con su autor y su licencia en el visor.
 */
export function GalleryPage() {
  const { t, i18n } = useTranslation();
  const photos = useAllPhotos(); // H35: con Mapillary son más de 100
  const list = photos.items;
  const items = useMemo(() => ribbonPhotos(list, t, i18n.language), [list, t, i18n.language]);
  const root = useRef<HTMLDivElement>(null);
  useBatchReveal(root, photos.status !== 'loading', useReducedMotion());

  return (
    <div ref={root} className="flex flex-col gap-10">
      <PageHeader title={t('nav.gallery')} description={t('pages.gallery')} />
      <p className="ui-prose m-0 text-step-0">{t('galleryPage.note')}</p>
      <section aria-labelledby="gallery-photos" className="flex flex-col gap-6">
        <h2 id="gallery-photos" className="m-0 text-step-2 text-fg">{t('galleryPage.photos')}</h2>
        {photos.status === 'loading' ? <Skeleton className="h-48 w-full" lines={3} /> : null}
        {photos.status === 'error' ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-sm border border-error bg-surface p-6">
            <p className="m-0 text-fg">{t('modules.error')}</p>
            <Button variant="secondary" size="sm" onClick={photos.retry}>{t('modules.retry')}</Button>
          </div>
        ) : null}
        {photos.status === 'success' && !list.length ? (
          <p className="m-0 text-fg-secondary">{t('galleryPage.empty')}</p>
        ) : null}
        {/* Con otro número de fotos (al reintentar tras un error) la cinta se monta de nuevo. */}
        {photos.status === 'loading' ? null : <PhotoRibbon key={items.length} photos={items} />}
      </section>
    </div>
  );
}
