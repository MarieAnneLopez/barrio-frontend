import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { remainingVisible, SCREEN_LEAVE_MS } from '../../hooks/useLoadingScreen';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { useLoadingStore } from '../../store/loadingStore';
import { LoadingScreen } from './LoadingScreen';

const status = () => screen.queryByRole('status');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  useLoadingStore.setState({ tasks: {} });
  useLoadingScreenStore.setState({ lazy: 0, visible: false });
});

afterEach(() => vi.useRealTimers());

describe('Pantalla de carga completa (H33)', () => {
  it('el mínimo de 700 ms se cuenta desde que aparece', () => {
    expect(remainingVisible(1000, 1100)).toBe(600);
    expect(remainingVisible(1000, 1800)).toBe(0);
  });

  it('al arrancar muestra a Mini Marie corriendo al menos 700 ms y luego se desvanece', () => {
    render(<LoadingScreen />);
    expect(status()).toHaveTextContent('Cargando El Tintal…');
    expect(status()?.querySelector('.sequence[data-sequence="run"]')).not.toBeNull();
    expect(useLoadingScreenStore.getState().visible).toBe(true);

    act(() => void vi.advanceTimersByTime(650)); // red en silencio, pero aún no 700 ms
    expect(status()).not.toHaveAttribute('data-leaving');
    act(() => void vi.advanceTimersByTime(100));
    expect(status()).toHaveAttribute('data-leaving');
    act(() => void vi.advanceTimersByTime(SCREEN_LEAVE_MS));
    expect(status()).toBeNull();
    expect(useLoadingScreenStore.getState().visible).toBe(false);
  });

  it('vuelve mientras baja el código de una página', () => {
    render(<LoadingScreen />);
    for (const ms of [200, 600, SCREEN_LEAVE_MS]) act(() => void vi.advanceTimersByTime(ms)); // arranque
    expect(status()).toBeNull();

    act(() => useLoadingScreenStore.getState().beginLazy());
    expect(status()).toBeInTheDocument();
    act(() => useLoadingScreenStore.getState().endLazy());
    act(() => void vi.advanceTimersByTime(699));
    expect(status()).not.toHaveAttribute('data-leaving');
    act(() => void vi.advanceTimersByTime(1));
    expect(status()).toHaveAttribute('data-leaving');
    act(() => void vi.advanceTimersByTime(SCREEN_LEAVE_MS));
    expect(status()).toBeNull();
  });
});
