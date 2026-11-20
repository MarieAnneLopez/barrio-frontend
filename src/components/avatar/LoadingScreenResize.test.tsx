import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { useLoadingStore } from '../../store/loadingStore';
import { setViewport } from '../../test/renderRoute';
import { LoadingScreen } from './LoadingScreen';
const widen = (width: number) => Object.assign(window, { innerWidth: width });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  useLoadingStore.setState({ tasks: {} });
  useLoadingScreenStore.setState({ lazy: 0, visible: false });
  setViewport(true);
  const base = window.matchMedia;
  window.matchMedia = (query: string) => ({ ...base(query), matches: false }); // 210 px, 1×, con movimiento
  widen(390);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  widen(1024);
});

it('conserva la misma corredora anclada a la barra al girar el celular', () => {
  const { container } = render(<LoadingScreen />);
  const runner = container.querySelector('.bar-runner .sequence');
  expect(runner).toBeInTheDocument();
  act(() => {
    widen(844);
    window.dispatchEvent(new Event('resize'));
  });
  expect(container.querySelector('.bar-runner .sequence')).toBe(runner);
  expect(container.querySelectorAll('[data-sequence="run"]')).toHaveLength(1);
});
