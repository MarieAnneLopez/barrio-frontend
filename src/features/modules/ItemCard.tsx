import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';
import { VerifiedBadge } from './VerifiedBadge';

interface ItemCardProps {
  item: ModuleItem;
  summary: readonly string[];
  selected: boolean;
  onShowOnMap: (id: number) => void;
}

/** Tarjeta de un lugar: nombre, datos clave, estado de verificación y enlace al mapa. */
export function ItemCard({ item, summary, selected, onShowOnMap }: ItemCardProps) {
  const { t } = useTranslation();
  const rows = summary.filter((field) => item[field] !== null && item[field] !== undefined && item[field] !== '');
  const display = (field: string) =>
    t(`values.${field}.${String(item[field])}`, { defaultValue: String(item[field]) });

  return (
    <li
      className={`flex flex-col gap-3 rounded-md border p-4 ${
        selected ? 'border-active bg-glass shadow-[var(--glow-active)]' : 'border-line bg-surface'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="m-0 text-step-0 text-fg">{item.nombre ?? `#${item.id}`}</h3>
        <VerifiedBadge item={item} />
      </div>
      {rows.length ? (
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-step--1">
          {rows.map((field) => (
            <div key={field} className="contents">
              <dt className="text-fg-muted">{t(`fields.${field}`)}</dt>
              <dd className="m-0 text-fg-secondary">{display(field)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {item.geometry ? (
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onShowOnMap(item.id)}
          className="ui-pressable ui-btn--ghost self-start rounded-sm border border-transparent px-2 py-1 text-step--1 text-accent underline underline-offset-4"
        >
          {selected ? t('modules.selected') : t('modules.showOnMap')}
        </button>
      ) : null}
    </li>
  );
}
