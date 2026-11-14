import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { useApi } from '../../hooks/useApi';
import type { ModuleItem } from '../../lib/apiTypes';
import { labelOf, moduleFields } from '../../lib/moduleFields';
import { AuthGuard } from '../auth/AuthGuard';
import { displayValue, hasValue } from './displayValue';
import { Gallery } from './Gallery';
import { ItemActions } from './ItemActions';
import { RatingPanel } from './RatingPanel';
import { SourceLine } from './SourceLine';
import { VerifiedBadge } from './VerifiedBadge';

interface ItemDetailModalProps {
  slug: string;
  itemId: number | null;
  onClose: () => void;
  onEdit: (item: ModuleItem) => void;
  onDeleted: () => void;
}

/** Ficha completa de un lugar: campos, verificación, fuente, galería y calificaciones. */
export function ItemDetailModal({ slug, itemId, onClose, onEdit, onDeleted }: ItemDetailModalProps) {
  const { t, i18n } = useTranslation();
  const item = useApi<ModuleItem>(itemId === null ? null : `/${slug}/${itemId}`);
  const data = item.status === 'success' ? item.data : undefined;
  const title = data ? labelOf(data, slug) : t('modules.detail');

  return (
    <Modal open={itemId !== null} onClose={onClose} title={title} wide>
      {item.status === 'loading' ? <Skeleton className="h-24 w-full" lines={4} /> : null}
      {item.status === 'error' ? (
        <p role="alert" className="m-0 text-fg">
          {t('modules.error')}
        </p>
      ) : null}
      {data ? (
        <div className="flex max-h-[65dvh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="self-start">
            <VerifiedBadge item={data} />
          </div>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-step--1">
            {moduleFields(slug)
              .fields.filter((f) => hasValue(data[f.name]))
              .map((f) => (
                <div key={f.name} className="contents">
                  <dt className="text-fg-muted">{t(`fields.${f.name}`)}</dt>
                  <dd className="m-0 whitespace-pre-line break-words text-fg">
                    {displayValue(t, slug, f.name, data[f.name], i18n.language)}
                  </dd>
                </div>
              ))}
          </dl>
          <SourceLine item={data} />
          <Gallery slug={slug} itemId={data.id} place={title} />
          <RatingPanel slug={slug} itemId={data.id} />
          <AuthGuard role="admin">
            <ItemActions path={`/${slug}/${data.id}`} name={title} onEdit={() => onEdit(data)} onDeleted={onDeleted} />
          </AuthGuard>
        </div>
      ) : null}
    </Modal>
  );
}
