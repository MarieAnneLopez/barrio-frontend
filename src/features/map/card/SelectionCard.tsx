import '../vidrio.css';
import { useId, useRef, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useTintal3D } from '../../../three/data/useTintal3D';
import { buildingInfo } from '../../../three/selection/buildingInfo';
import { useSelectionStore } from '../../../three/selection/selectionStore';
import { BuildingCard } from './BuildingCard';
import { PlaceCard } from './PlaceCard';
import { useCardFocus } from './useCardFocus';
import { usePlace } from './usePlace';

type OpenPlace = ((slug: string, id: number) => void) | undefined;

function SelectedBuilding({ index, titleId }: { index: number; titleId: string }) {
  const { t } = useTranslation();
  const world = useTintal3D();
  if (world.status !== 'ready') return <Skeleton className="h-24 w-full" lines={3} />;
  const info = buildingInfo(world.data.edificios, index);
  return info ? <BuildingCard info={info} titleId={titleId} /> : <p id={titleId} className="m-0">{t('card.missing')}</p>;
}

function SelectedPlace({ slug, id, titleId, onOpenPlace }: { slug: string; id: number; titleId: string; onOpenPlace: OpenPlace }) {
  const { t } = useTranslation();
  const place = usePlace(slug, id);
  if (place.status === 'loading') return <Skeleton className="h-24 w-full" lines={3} />;
  if (place.status === 'missing') return <p id={titleId} className="m-0 pr-10">{t('card.missing')}</p>;
  return <PlaceCard slug={slug} item={place.item} titleId={titleId} onOpenPlace={onOpenPlace} />;
}

interface SelectionCardProps {
  onOpenPlace?: OpenPlace;
  /** Adónde vuelve el foco al cerrar si el control que la abrió ya no está. */
  returnFocus?: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * Ficha de lo elegido en la maqueta (gran actualización): un edificio real o un lugar de un módulo
 * (selectionStore), en el mismo vidrio que el panel. Botón cerrar, Escape y foco accesible.
 */
export function SelectionCard({ onOpenPlace, returnFocus, className = '' }: SelectionCardProps) {
  const { t } = useTranslation();
  const selected = useSelectionStore((s) => s.selected);
  const titleId = useId();
  const card = useRef<HTMLElement>(null);
  const close = useCardFocus(card, selected, returnFocus);
  if (!selected) return null;

  return (
    <aside
      ref={card}
      aria-labelledby={titleId}
      data-card={selected.kind}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        close();
      }}
      className={`vidrio tone-papel pointer-events-auto relative flex flex-col gap-3 overflow-y-auto p-4 ${className}`}
    >
      <button
        type="button"
        onClick={close}
        aria-label={t('card.close')}
        className="ui-pressable ui-btn--ghost absolute top-1 right-1 inline-flex size-11 items-center justify-center rounded-sm border border-transparent text-fg"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {selected.kind === 'building' ? (
        <SelectedBuilding index={selected.index} titleId={titleId} />
      ) : (
        <SelectedPlace slug={selected.slug} id={selected.id} titleId={titleId} onOpenPlace={onOpenPlace} />
      )}
    </aside>
  );
}
