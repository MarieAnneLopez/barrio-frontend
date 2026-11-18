import { useHeroStore, type HoveredBuilding } from '../heroStore';
import { useSelectionStore, type Selection } from '../selection/selectionStore';
import type { BuildingSource } from './protocol';
import { volumeOf } from './volume';

// HUD de la maqueta (HeroHud lee heroStore.hovered): «Edificio · tipo · pisos · m² de planta» del
// edificio bajo el puntero. Antes lo escribía BuildingsLayer; ahora sale del selectionStore. Los datos
// 3D (TNT3) no clasifican edificios: el tipo va vacío y el HUD dice «sin clasificar». Si los pisos no
// son dato (12 edificios de OSM, dibujados con 3 pisos por regla), el HUD no muestra nada de ese edificio.

type Source = Pick<BuildingSource, 'xz' | 'anillos' | 'edificios' | 'pisos' | 'base' | 'banderas'>;

/** Área de la planta en m²: anillo exterior menos huecos (fórmula de Gauss; anillos abiertos). */
export function footprintArea(s: Pick<Source, 'xz' | 'anillos' | 'edificios'>, b: number): number {
  const first = s.edificios[b] ?? 0;
  const last = s.edificios[b + 1] ?? first;
  let total = 0;
  for (let r = first; r < last; r++) {
    const start = s.anillos[r] ?? 0;
    const end = s.anillos[r + 1] ?? start;
    let sum = 0;
    for (let i = start; i < end; i++) {
      const j = i + 1 < end ? i + 1 : start;
      sum += (s.xz[2 * i] ?? 0) * (s.xz[2 * j + 1] ?? 0) - (s.xz[2 * j] ?? 0) * (s.xz[2 * i + 1] ?? 0);
    }
    total += (r === first ? 1 : -1) * Math.abs(sum) / 2;
  }
  return total;
}

/** Lo que el HUD dice del edificio bajo el puntero, o null (un lugar, nada, o pisos sin dato). */
export function hoveredBuilding(s: Source, hovered: Selection | null): HoveredBuilding | null {
  if (hovered?.kind !== 'building') return null;
  const volume = volumeOf(s, hovered.index);
  if (!volume?.known) return null;
  return { index: hovered.index, kind: null, levels: volume.levels, areaM2: footprintArea(s, hovered.index) };
}

/** Copia al HUD el edificio bajo el puntero mientras la maqueta está montada; devuelve cómo soltarlo. */
export function bridgeHover(s: Source): () => void {
  const { setHovered } = useHeroStore.getState();
  setHovered(hoveredBuilding(s, useSelectionStore.getState().hovered));
  const off = useSelectionStore.subscribe((state, prev) => {
    if (state.hovered !== prev.hovered) setHovered(hoveredBuilding(s, state.hovered));
  });
  return () => {
    off();
    setHovered(null);
  };
}
