import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAllPhotos } from '../../hooks/useAllPhotos';
import { photoAlt } from '../../lib/photoUrls';
import { PageHeader } from '../pages/PageHeader';
import { PhotoCredit } from './PhotoCredit';

/**
 * Créditos de fotos (H35): cada foto publicada con su lugar, autor, licencia y página
 * de origen (Commons o Mapillary). Aclara el único cambio hecho: tamaño y formato.
 */
export function PhotoCreditsPage() {
  const { t, i18n } = useTranslation();
  const photos = useAllPhotos();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('credits.title')} description={t('credits.description')} />
      <p className="ui-prose m-0 text-step-0">{t('credits.changes')}</p>
      {photos.status === 'loading' ? <Skeleton className="h-48 w-full" lines={4} /> : null}
      {photos.status === 'error' ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-sm border border-error bg-surface p-6">
          <p className="m-0 text-fg">{t('modules.error')}</p>
          <Button variant="secondary" size="sm" onClick={photos.retry}>{t('modules.retry')}</Button>
        </div>
      ) : null}
      {photos.status === 'success' ? (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <p className="m-0 text-step--1 text-fg-muted">{t('credits.count', { count: photos.items.length })}</p>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {photos.items.map((photo) => (
              <li key={photo.id} className="flex flex-col gap-1 border-b border-line pb-3">
                <Link to={`/categorias/${photo.categoria_slug}`} className="text-step-0 text-fg underline underline-offset-2">
                  {photo.nombre}
                </Link>
                <span className="text-step--1 text-fg-secondary">{photoAlt(photo, i18n.language)}</span>
                <PhotoCredit author={photo.autor} license={photo.licencia} source={photo.source_ref} />
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
