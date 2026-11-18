import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';
import { isSampleRecord } from '../../lib/verification';

const ACTION =
  'ui-pressable ui-btn--secondary inline-flex min-h-11 items-center self-start rounded-sm border border-fg bg-secondary px-3 text-step--1 text-on-mark';

/**
 * Dónde queda el lugar, en la ficha completa (gran actualización): en vez de una vista previa aparte,
 * «Ver en la maqueta» cierra la ficha y lleva la cámara de la misma maqueta, que está detrás, hasta
 * el lugar, con su ficha corta abierta. Un dato de ejemplo o un lugar sin ubicación lo dicen.
 */
export function PlaceOnModel({ item, onShow }: { item: ModuleItem; onShow: (id: number) => void }) {
  const { t } = useTranslation();
  if (isSampleRecord(item)) return <p className="m-0 text-step--1 text-fg">{t('stage.sample')}</p>;
  if (!item.geometry) return <p className="m-0 text-step--1 text-fg">{t('stage.noPlace')}</p>;
  return (
    <button type="button" onClick={() => onShow(item.id)} className={ACTION}>
      {t('stage.showOnModel')}
    </button>
  );
}
