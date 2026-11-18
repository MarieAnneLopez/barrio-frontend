import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';
import { onTheModel } from '../../lib/categoryConfig';
import { isSampleRecord } from '../../lib/verification';

const ACTION =
  'ui-pressable ui-btn--secondary inline-flex min-h-11 items-center self-start rounded-sm border border-fg bg-secondary px-3 text-step--1 text-on-mark';

interface PlaceOnModelProps {
  slug: string;
  item: ModuleItem;
  onShow: (id: number) => void;
}

/**
 * Dónde queda el lugar, en la ficha completa (gran actualización): en vez de una vista previa aparte,
 * «Ver en la maqueta» cierra la ficha y lleva la cámara de la misma maqueta, que está detrás, hasta
 * el lugar, con su ficha corta abierta. Un dato de ejemplo, un lugar sin ubicación o la localidad
 * (abarca el barrio entero y más: la maqueta no la señala) lo dicen.
 */
export function PlaceOnModel({ slug, item, onShow }: PlaceOnModelProps) {
  const { t } = useTranslation();
  const note = (key: string) => <p className="m-0 text-step--1 text-fg">{t(key)}</p>;
  if (!onTheModel(slug)) return note('stage.wholeArea');
  if (isSampleRecord(item)) return note('stage.sample');
  if (!item.geometry) return note('stage.noPlace');
  return (
    <button type="button" onClick={() => onShow(item.id)} className={ACTION}>
      {t('stage.showOnModel')}
    </button>
  );
}
