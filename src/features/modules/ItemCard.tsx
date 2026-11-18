import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';
import { labelOf, moduleFields } from '../../lib/moduleFields';
import { displayValue, hasValue } from './displayValue';
import { VerifiedBadge } from './VerifiedBadge';

interface ItemCardProps {
  slug: string;
  item: ModuleItem;
  selected: boolean;
  onShowOnMap: (id: number) => void;
  onOpen: (id: number) => void;
}

/** Tarjeta de un lugar: nombre, datos clave, estado de verificación, mapa y detalle. */
export function ItemCard({ slug, item, selected, onShowOnMap, onOpen }: ItemCardProps) {
  const { t, i18n } = useTranslation();
  const rows = moduleFields(slug).summary.filter((field) => hasValue(item[field]));
  const name = labelOf(item, slug);

  return (
    <li
      className={`flex flex-col gap-3 rounded-md border p-4 ${
        selected ? 'border-active bg-glass shadow-[var(--glow-active)]' : 'tone-papel border-line bg-pink'
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpen(item.id)}
          className="ui-pressable ui-btn--ghost rounded-sm border border-line px-2 py-1 text-step--1 text-fg"
        >
          {t('modules.detail')}{' '}
          <span className="sr-only">{t('modules.detailOf', { name })}</span>
        </button>
        {item.geometry ? (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => onShowOnMap(item.id)}
            className="ui-pressable ui-btn--ghost rounded-sm border border-transparent px-2 py-1 text-step--1 text-accent underline underline-offset-4"
          >
            {selected ? t('modules.selected') : t('modules.showOnMap')}
          </button>
        ) : null}
      </div>
    </li>
  );
}
