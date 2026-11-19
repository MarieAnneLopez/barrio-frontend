import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { useLoadingStore } from '../../store/loadingStore';
import { setViewport } from '../../test/renderRoute';
import { LoadingScreen } from './LoadingScreen';
import { runPath } from './loadingRun';
import { FRAME_MS } from './sequences';

interface Run { cancel: ReturnType<typeof vi.fn>; currentTime: number | null }
const animate = vi.fn((): Run => ({ cancel: vi.fn(), currentTime: 0 }));
const run = (call: number) => animate.mock.results[call]?.value as Run;
/** Cuadros del recorrido que recibió la llamada `call` (un fotograma clave más que cuadros). */
const frames = (call: number) => (animate.mock.calls[call] as unknown as [Keyframe[]])[0].length - 1;
/** Cuadro en el que va la carrera de la llamada `call`. */
const frameOf = (call: number) => Math.floor((run(call).currentTime ?? 0) / FRAME_MS.run);
const widen = (width: number) => Object.assign(window, { innerWidth: width });
function resize(width: number) {
  act(() => {
    widen(width);
    window.dispatchEvent(new Event('resize'));
  });
}
const count = (spy: { mock: { calls: unknown[][] } }, type: string) => spy.mock.calls.filter(([name]) => name === type).length;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  useLoadingStore.setState({ tasks: {} });
  useLoadingScreenStore.setState({ lazy: 0, visible: false });
  setViewport(true);
  const base = window.matchMedia;
  window.matchMedia = (query: string) => ({ ...base(query), matches: false }); // 210 px, 1×, con movimiento
  animate.mockClear();
  Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true });
  widen(390);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  widen(1024);
});

// Auditoría MM-10: el recorrido se calculaba una vez con el ancho de entonces. Al girar el celular
// (390 → 844) ella volvía a entrar por la izquierda a mitad de pantalla.
describe('Pantalla de carga: el recorrido sigue al ancho de la pantalla', () => {
  it('al girar el celular rehace el recorrido para el ancho nuevo y sigue donde iba', () => {
    render(<LoadingScreen />);
    expect(frames(0)).toBe(runPath(390, 210, 154).frames);
    run(0).currentTime = 50.5 * FRAME_MS.run; // va por el cuadro 50
    resize(844);
    expect(run(0).cancel).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(frames(1)).toBe(runPath(844, 210, 154).frames);
    expect(frameOf(1)).toBe(50); // el mismo cuadro del recorrido: la misma posición, sin salto
  });

  it('si en la pantalla nueva ya habría salido, vuelve a entrar por la izquierda', () => {
    widen(844);
    render(<LoadingScreen />);
    run(0).currentTime = 400.5 * FRAME_MS.run; // a 546 px: fuera de una pantalla de 390
    resize(390);
    expect(frames(1)).toBe(runPath(390, 210, 154).frames);
    expect(frameOf(1)).toBe(0);
  });

  it('escucha el giro y el cambio de tamaño solo mientras está montada', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<LoadingScreen />);
    unmount();
    for (const type of ['resize', 'orientationchange']) {
      expect(count(add, type)).toBeGreaterThan(0);
      expect(count(remove, type)).toBe(count(add, type));
    }
    resize(844);
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
