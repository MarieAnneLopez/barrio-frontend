import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { useLoadingStore } from '../../store/loadingStore';
import { setViewport } from '../../test/renderRoute';
import { LoadingScreen } from './LoadingScreen';

// sprites32: la carrera avanza zancada / 32 por cuadro, redondeada a px enteros sin acumular error.
// Con fracciones de px por cuadro no basta con steps() entre dos extremos: la API de animaciones
// recibe una posición entera por cuadro (loadingRun.ts) y la sostiene hasta el cuadro siguiente.
const animate = vi.fn(() => ({ cancel: vi.fn() }));

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

  it('con movimiento reducido no corre: queda quieta al centro', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    render(<LoadingScreen />);
    expect(animate).not.toHaveBeenCalled();
  });
});
