import { beforeEach, describe, expect, it } from 'vitest';
import { useHeroStore } from '../heroStore';
import { useSelectionStore } from '../selection/selectionStore';
import { fakeSource, hole, square } from './fixture';
import { bridgeHover, footprintArea, hoveredBuilding } from './hud';

const source = fakeSource([
  { rings: [square(0, 0, 10)], pisos: 2 },
  { rings: [square(20, 0, 10), hole(23, -3, 4)], pisos: 5, base: 1 },
  { rings: [square(40, 0, 10)], pisos: 0, banderas: 0 }, // de OSM sin pisos: se dibujan 3 por regla
]);

beforeEach(() => {
  useSelectionStore.setState({ selected: null, hovered: null });
  useHeroStore.setState({ hovered: null });
});

describe('HUD de la maqueta: el edificio bajo el puntero', () => {
  it('el área de la planta es el exterior menos los huecos (m²)', () => {
    expect(footprintArea(source, 0)).toBe(100);
    expect(footprintArea(source, 1)).toBe(84);
  });

  it('lleva los pisos y el área reales; los datos 3D no traen tipo («sin clasificar»)', () => {
    expect(hoveredBuilding(source, { kind: 'building', index: 1 })).toEqual({ index: 1, kind: null, levels: 5, areaM2: 84 });
  });

  it('no presenta como dato los pisos puestos por regla, ni describe lugares', () => {
    expect(hoveredBuilding(source, { kind: 'building', index: 2 })).toBeNull();
    expect(hoveredBuilding(source, { kind: 'place', slug: 'parques', id: 4 })).toBeNull();
    expect(hoveredBuilding(source, null)).toBeNull();
  });

  it('mientras la maqueta está montada, el hover del selectionStore llega al HUD (heroStore)', () => {
    useSelectionStore.getState().hover({ kind: 'building', index: 0 });
    const off = bridgeHover(source);
    expect(useHeroStore.getState().hovered).toEqual({ index: 0, kind: null, levels: 2, areaM2: 100 });
    useSelectionStore.getState().hover({ kind: 'place', slug: 'parques', id: 4 });
    expect(useHeroStore.getState().hovered).toBeNull();
    useSelectionStore.getState().hover({ kind: 'building', index: 1 });
    expect(useHeroStore.getState().hovered?.levels).toBe(5);
    off();
    expect(useHeroStore.getState().hovered).toBeNull();
    useSelectionStore.getState().hover({ kind: 'building', index: 0 });
    expect(useHeroStore.getState().hovered).toBeNull();
  });
});
