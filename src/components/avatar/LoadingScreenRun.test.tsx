import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { useLoadingStore } from '../../store/loadingStore';
import { setViewport } from '../../test/renderRoute';
import { LoadingScreen } from './LoadingScreen';
import { LOADER_WIDE, offsetAt } from './loadingRun';

// sprites32: la carrera avanza zancada / 32 por cuadro, redondeada a px enteros sin acumular error.
// Con fracciones de px por cuadro no basta con steps() entre dos extremos: la API de animaciones
// recibe una posición entera por cuadro (loadingRun.ts) y la sostiene hasta el cuadro siguiente.
const animate = vi.fn(() => ({ cancel: vi.fn() }));
/** Lo que avanza el primer cuadro de la carrera que recibió la llamada `call` a animate. */
const firstStep = (call: number) => {
  const [keys] = animate.mock.calls[call] as unknown as [Keyframe[]];
  const x = (k: Keyframe | undefined) => parseInt(String(k?.transform).slice('translate3d('.length), 10);
  return x(keys[1]) - x(keys[0]);
};
const handle = (call: number) => animate.mock.results[call]?.value as { cancel: ReturnType<typeof vi.fn> };
/** Solo cambia si cabe a 420 px de alto (setViewport(false) también pediría menos movimiento). */
const fits = (wide: boolean) => {
  setViewport(true);
  const base = window.matchMedia;
  window.matchMedia = (query: string) => ({ ...base(query), matches: query === LOADER_WIDE && wide });
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  useLoadingStore.setState({ tasks: {} });
  useLoadingScreenStore.setState({ lazy: 0, visible: false });
  setViewport(true);
  animate.mockClear();
  Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
  act(() => useA11yStore.getState().reset());
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});

describe('Pantalla de carga: carrera de 32 cuadros (sprites32)', () => {
  it('corre con un fotograma clave por cuadro, en px enteros, en bucle', () => {
    render(<LoadingScreen />);
    expect(animate).toHaveBeenCalledTimes(1);
    const [keys, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(options).toMatchObject({ iterations: Infinity });
    expect(options.duration).toBeCloseTo((keys.length - 1) * (1000 / 24));
    expect(keys.every((k) => /^translate3d\(-?\d+px, 0, 0\)$/.test(String(k.transform)))).toBe(true);
    expect(keys.every((k) => k.easing === 'step-end')).toBe(true);
  });

  it('al cambiar de tamaño cancela la carrera y la rehace con el paso nuevo; al desmontarse, la cancela', () => {
    fits(true);
    const { rerender, unmount } = render(<LoadingScreen />);
    expect(firstStep(0)).toBe(offsetAt(1, 420));
    fits(false); // la pantalla ya no da para 420 px de alto: 210
    rerender(<LoadingScreen />);
    expect(handle(0).cancel).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(firstStep(1)).toBe(offsetAt(1, 210));
    unmount();
    expect(handle(1).cancel).toHaveBeenCalledTimes(1);
  });

  it('al ocultarse (terminó de cargar) la carrera se cancela: nada queda corriendo', () => {
    render(<LoadingScreen />);
    for (const ms of [200, 600, 300]) act(() => void vi.advanceTimersByTime(ms)); // arranque, mínimo y salida
    expect(handle(0).cancel).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.loading-screen')).toBeNull();
  });

  it('con movimiento reducido no corre: queda quieta al centro', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    render(<LoadingScreen />);
    expect(animate).not.toHaveBeenCalled();
  });
});
