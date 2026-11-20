import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { useLoadingStore } from '../../store/loadingStore';
import { setViewport } from '../../test/renderRoute';
import { LoadingScreen } from './LoadingScreen';
const animate = vi.fn();

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

describe('Mini Marie corre únicamente sobre la barra', () => {
  it.each([false, true])('mantiene libre el fondo con movimiento reducido %s', (reducedMotion) => {
    act(() => useA11yStore.setState({ reducedMotion }));
    const { container } = render(<LoadingScreen />);
    expect(container.querySelector('.loading-screen__stage [data-sequence]')).toBeNull();
    expect(container.querySelectorAll('.bar-runner [data-sequence="run"]')).toHaveLength(1);
    expect(animate).not.toHaveBeenCalled();
  });
});
