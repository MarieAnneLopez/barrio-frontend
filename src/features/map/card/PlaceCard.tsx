import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ModuleItem } from '../../../lib/apiTypes';
import { categoryPath, findCategory } from '../../../lib/categoryConfig';
import { labelOf, moduleFields } from '../../../lib/moduleFields';
import { displayValue, hasValue } from '../../modules/displayValue';
import { SourceLine } from '../../modules/SourceLine';
import { VerifiedBadge } from '../../modules/VerifiedBadge';
import { MapSources } from './MapSources';

const ACTION =
  'ui-pressable ui-btn--secondary inline-flex min-h-11 items-center self-start rounded-sm border border-fg bg-secondary px-3 text-step--1 text-on-mark no-underline';

interface PlaceCardProps {
  slug: string;
  item: ModuleItem;
  titleId: string;
  /** Dentro de su módulo la ficha completa se abre ahí mismo; fuera, se enlaza al módulo con el lugar enfocado. */
  onOpenPlace?: ((slug: string, id: number) => void) | undefined;
}

/** Ficha de un lugar de un módulo: nombre, datos clave del módulo, verificación y fuentes. */
export function PlaceCard({ slug, item, titleId, onOpenPlace }: PlaceCardProps) {
  const { t, i18n } = useTranslation();
  const module = t(`categories.${slug}.name`);
  const rows = moduleFields(slug).summary.filter((field) => hasValue(item[field]));

  return (
    <>
      <p className="ui-eyebrow m-0 pr-10">
        <span aria-hidden="true">{findCategory(slug)?.emoji} </span>
        {module}
      </p>
      <h2 id={titleId} tabIndex={-1} className="m-0 text-step-1 break-words">{labelOf(item, slug)}</h2>
      <div className="self-start">
        <VerifiedBadge item={item} />
      </div>
      {rows.length ? (
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-step--1">
          {rows.map((field) => (
            <div key={field} className="contents">
              <dt>{t(`fields.${field}`)}</dt>
              <dd className="m-0 break-words">{displayValue(t, slug, field, item[field], i18n.language)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {onOpenPlace ? (
        <button type="button" onClick={() => onOpenPlace(slug, item.id)} className={ACTION}>
          {t('card.fullDetail')}
        </button>
      ) : (
        <Link to={`${categoryPath(slug)}?enfoque=${item.id}`} className={ACTION}>
          {t('hero.openModule', { module })}
        </Link>
      )}
      <SourceLine item={item} />
      <MapSources />
    </>
  );
}
