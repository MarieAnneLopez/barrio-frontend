import type { ThreeEvent } from '@react-three/fiber';
import { Mesh } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSelectionStore } from '../selection/selectionStore';
import { buildAll } from './builder';
import { fakeSource, square } from './fixture';
import { applySelection, CLICK_SLOP_PX, createPickHandlers } from './picking';
import { tileGeometry } from './tileGeometry';

const [tile] = buildAll(fakeSource([{ rings: [square(0, 0, 10)], pisos: 2 }, { rings: [square(20, 0, 10)], pisos: 3 }])).tiles;
if (!tile) throw new Error('sin tesela');
const mesh = new Mesh(tileGeometry(tile));
/** Evento de r3f sobre la primera cara del edificio k de la tesela. */
const on = (k: number, delta = 0) => ({
  object: mesh,
  face: { a: tile.index[tile.ranges[k] ?? 0] ?? 0, b: 0, c: 0 },
  delta,
  stopPropagation: vi.fn(),
}) as unknown as ThreeEvent<PointerEvent> & ThreeEvent<MouseEvent>;

let cursor = '';
const handlers = createPickHandlers((value) => {
  cursor = value;
});

beforeEach(() => {
  useSelectionStore.setState({ selected: null, hovered: null });
  cursor = '';
});

describe('selección de edificios con el puntero', () => {
  it('al pasar marca el edificio (hover) y pone el cursor de mano, sin detener el evento', () => {
    const event = on(1);
    handlers.onPointerMove(event);
    expect(useSelectionStore.getState().hovered).toEqual({ kind: 'building', index: 1 });
    expect(cursor).toBe('pointer');
    expect(event.stopPropagation).not.toHaveBeenCalled(); // la cámara (MapControls) sigue igual
  });

  it('al salir quita el hover del edificio, pero no el de un lugar', () => {
    handlers.onPointerMove(on(0));
    handlers.onPointerOut();
    expect([useSelectionStore.getState().hovered, cursor]).toEqual([null, '']);
    useSelectionStore.getState().hover({ kind: 'place', slug: 'parques', id: 4 });
    handlers.onPointerOut();
    expect(useSelectionStore.getState().hovered).toEqual({ kind: 'place', slug: 'parques', id: 4 });
  });

  it('el clic elige el edificio y solo ese clic detiene la propagación', () => {
    const click = on(1);
    handlers.onClick(click);
    expect(useSelectionStore.getState().selected).toEqual({ kind: 'building', index: 1 });
    expect(click.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('un arrastre de la cámara que termina sobre un edificio no lo elige', () => {
    const drag = on(0, CLICK_SLOP_PX + 1);
    handlers.onClick(drag);
    expect(useSelectionStore.getState().selected).toBeNull();
    expect(drag.stopPropagation).not.toHaveBeenCalled();
  });
});

describe('uniformes de resalte', () => {
  it('llevan el índice del edificio bajo el puntero y del elegido (−1 si no hay)', () => {
    const uniforms = { uHover: { value: 0 }, uSelected: { value: 0 } };
    applySelection(uniforms, { hovered: { kind: 'building', index: 12 }, selected: { kind: 'place', slug: 'x', id: 1 } });
    expect([uniforms.uHover.value, uniforms.uSelected.value]).toEqual([12, -1]);
    applySelection(uniforms, { hovered: null, selected: { kind: 'building', index: 3 } });
    expect([uniforms.uHover.value, uniforms.uSelected.value]).toEqual([-1, 3]);
  });
});
