import { useTranslation } from 'react-i18next';
import { labelOf } from '../../../lib/moduleFields';
import { useTintal3D } from '../../../three/data/useTintal3D';
import { usePlaceScope } from '../../../three/places/placeScope';
import { buildingInfo } from '../../../three/selection/buildingInfo';
import { useSelectionStore } from '../../../three/selection/selectionStore';
import { useTintalData } from '../../../three/useTintalData';
import { findPlace } from './usePlace';

/**
 * Lo que está bajo el puntero en la maqueta, en una línea para el HUD (selectionStore.hovered): un
 * edificio con su nombre o dirección y sus pisos, o un lugar con su módulo. null si no hay nada.
 */
export function useHoverLabel(): string | null {
  const { t } = useTranslation();
  const hovered = useSelectionStore((s) => s.hovered);
  const world = useTintal3D();
  const api = useTintalData();
  const scopeSlug = usePlaceScope((s) => s.slug);
  const scoped = usePlaceScope((s) => s.collection);
  if (!hovered) return null;
  if (hovered.kind === 'building') {
    const info = world.status === 'ready' ? buildingInfo(world.data.edificios, hovered.index) : null;
    if (!info) return null;
    const floors = info.floors === null ? t('card.floorsUnknown') : t('card.floorCount', { count: info.floors });
    return `${t('card.building')} · ${info.name ?? info.address ?? t('card.noAddress')} · ${floors}`;
  }
  const all = api.status === 'ready' ? api.data.categories.find((c) => c.slug === hovered.slug)?.collection : undefined;
  const item = findPlace([scopeSlug === hovered.slug ? scoped : null, all], hovered.id);
  return item ? `${t(`categories.${hovered.slug}.name`)} · ${labelOf(item, hovered.slug)}` : null;
}
