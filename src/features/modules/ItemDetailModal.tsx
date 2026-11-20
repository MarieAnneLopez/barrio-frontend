import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { StateIcon } from '../../components/ui/StateIcon';
import { useApi } from '../../hooks/useApi';
import type { ModuleItem } from '../../lib/apiTypes';
import { labelOf, moduleFields } from '../../lib/moduleFields';
import { AuthGuard } from '../auth/AuthGuard';
import { displayValue, hasValue } from './displayValue';
import { Gallery } from './Gallery';
import { ItemActions } from './ItemActions';
import { PlaceOnModel } from './PlaceOnModel';
import { RatingPanel } from './RatingPanel';
import { SourceLine } from './SourceLine';
import { VerifiedBadge } from './VerifiedBadge';

/** Descripción verificada (H35) en el idioma de la interfaz. */
const description = (item: ModuleItem, lang: string) => (lang === 'en' ? item.descripcion_en : item.descripcion_es);

interface ItemDetailModalProps {
  slug: string;
  itemId: number | null;
  includeDrafts?: boolean;
  onClose: () => void;
  /** Cierra la ficha y muestra el lugar en la maqueta de la sección. */
  onShowOnMap: (id: number) => void;
  onEdit: (item: ModuleItem) => void;
  onDeleted: () => void;
}

/** Ficha completa de un lugar: campos, verificación, fuente, ubicación en la maqueta, galería y calificaciones. */
export function ItemDetailModal({ slug, itemId, includeDrafts, onClose, onShowOnMap, onEdit, onDeleted }: ItemDetailModalProps) {
  const { t, i18n } = useTranslation();
  const item = useApi<ModuleItem>(itemId === null ? null : `/${slug}${includeDrafts ? '/admin' : ''}/${itemId}`);
  const data = item.status === 'success' ? item.data : undefined;
  const title = data ? labelOf(data, slug) : t('modules.detail');

  return (
    <Modal open={itemId !== null} onClose={onClose} title={title} wide>
      {item.status === 'loading' ? <Skeleton className="h-24 w-full" lines={4} /> : null}
      {item.status === 'error' ? (
        <p role="alert" className="m-0 text-fg">
          <StateIcon kind="error" />
          {t('modules.error')}
        </p>
      ) : null}
      {data ? (
        <div className="flex max-h-[65dvh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="self-start">
            <VerifiedBadge item={data} />
          </div>
          {description(data, i18n.language) ? (
            <p className="m-0 text-step--1 text-fg">{description(data, i18n.language)}</p>
          ) : null}
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
          {data.publicado === false ? <p><StateIcon kind="warning" />{t('editorial:draft')}</p> : <>
          <PlaceOnModel slug={slug} item={data} onShow={onShowOnMap} />
          <Gallery slug={slug} itemId={data.id} place={title} />
          <RatingPanel slug={slug} itemId={data.id} />
          </>}
          <AuthGuard role="admin">
            <ItemActions path={`/${slug}/${data.id}`} name={title} onEdit={() => onEdit(data)} onDeleted={onDeleted} />
          </AuthGuard>
        </div>
      ) : null}
    </Modal>
  );
}
