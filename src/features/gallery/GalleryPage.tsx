import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useApi } from '../../hooks/useApi';
import type { GalleryPhoto, Page } from '../../lib/apiTypes';
import { PageHeader } from '../pages/PageHeader';
import { groupByPlace, neighborhoodViews } from './groupPhotos';
import { NeighborhoodViews } from './NeighborhoodViews';
import { PlaceGallery } from './PlaceGallery';

/** Galería General (D66): fotos reales de Commons de los lugares y vistas del barrio. */
export function GalleryPage() {
  const { t } = useTranslation();
  const photos = useApi<Page<GalleryPhoto>>('/fotos', { size: 100 });
  const list = photos.status === 'success' ? photos.data.items : [];
  const groups = groupByPlace(list);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t('nav.gallery')} description={t('pages.gallery')} />
      <p className="m-0 max-w-3xl text-step-0 text-fg-secondary">{t('galleryPage.note')}</p>
      <section aria-labelledby="gallery-places" className="flex flex-col gap-6">
        <h2 id="gallery-places" className="m-0 text-step-2 text-fg">{t('galleryPage.places')}</h2>
        {photos.status === 'loading' ? <Skeleton className="h-48 w-full" lines={3} /> : null}
        {photos.status === 'error' ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-error p-6">
            <p className="m-0 text-fg">{t('modules.error')}</p>
            <Button variant="secondary" size="sm" onClick={photos.retry}>{t('modules.retry')}</Button>
          </div>
        ) : null}
        {photos.status === 'success' && !groups.length ? (
          <p className="m-0 text-fg-secondary">{t('galleryPage.empty')}</p>
        ) : null}
        {groups.map((group) => <PlaceGallery key={group.key} group={group} />)}
      </section>
      {photos.status === 'loading' ? null : <NeighborhoodViews photos={neighborhoodViews(list)} />}
    </div>
  );
}
