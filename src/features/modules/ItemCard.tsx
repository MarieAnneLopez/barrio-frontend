import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';
import { labelOf, moduleFields } from '../../lib/moduleFields';
import { isSampleRecord } from '../../lib/verification';
import { useStage } from '../map/stage/stageContext';
import { displayValue, hasValue } from './displayValue';
import { VerifiedBadge } from './VerifiedBadge';

interface ItemCardProps {
  slug: string;
  item: ModuleItem;
  selected: boolean;
  onShowOnMap: (id: number) => void;
  onOpen: (id: number) => void;
}

/**
 * Tarjeta de un lugar en el panel del módulo: nombre, datos clave, verificación, detalle y «Ver en el
 * mapa» (lo elige y lleva la cámara hasta él). Un dato de ejemplo no se dibuja en la maqueta: lo dice.
 */
export function ItemCard({ slug, item, selected, onShowOnMap, onOpen }: ItemCardProps) {
  const { t, i18n } = useTranslation();
  const { reveal } = useStage();
  const rows = moduleFields(slug).summary.filter((field) => hasValue(item[field]));
  const name = labelOf(item, slug);
  const sample = isSampleRecord(item);

  return (
    <li
      className={`tone-papel flex flex-col gap-3 rounded-md border bg-pink p-4 ${
        selected ? 'border-active shadow-[var(--glow-active)]' : 'border-line'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="m-0 text-step-0 text-fg">{name}</h3>
        <VerifiedBadge item={item} />
      </div>
      {rows.length ? (
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-step--1">
          {rows.map((field) => (
            <div key={field} className="contents">
              <dt className="text-fg-muted">{t(`fields.${field}`)}</dt>
              <dd className="m-0 break-words text-fg-secondary">
                {displayValue(t, slug, field, item[field], i18n.language)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {sample ? <p className="m-0 text-step--1 text-fg">{t('stage.sample')}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpen(item.id)}
          className="ui-pressable ui-btn--ghost min-h-11 rounded-sm border border-line px-2 py-1 text-step--1 text-fg"
        >
          {t('modules.detail')}{' '}
          <span className="sr-only">{t('modules.detailOf', { name })}</span>
        </button>
        {item.geometry && !sample ? (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => {
              onShowOnMap(item.id);
              reveal();
            }}
            className="ui-pressable ui-btn--ghost min-h-11 rounded-sm border border-transparent px-2 py-1 text-step--1 text-accent underline underline-offset-4"
          >
            {selected ? t('modules.selected') : t('modules.showOnMap')}
          </button>
        ) : null}
      </div>
    </li>
  );
}
