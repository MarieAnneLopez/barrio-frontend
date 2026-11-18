import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_WORLD, worldPending } from '../../test/emptyWorld';
import type { Tintal3D } from './format';
import { resetTintal3D, RETRY_3D_MS, useTintal3D } from './useTintal3D';

afterEach(() => {
  vi.useRealTimers();
  worldPending();
});

describe('useTintal3D: los datos reales de la maqueta, una sola vez para toda la app', () => {
  it('se bajan una vez en el Web Worker y todos los que la usan comparten el resultado', async () => {
    const worker = vi.fn(() => Promise.resolve(EMPTY_WORLD));
    const main = vi.fn(() => Promise.resolve(EMPTY_WORLD));
    resetTintal3D({ worker, main });
    const first = renderHook(() => useTintal3D());
    const second = renderHook(() => useTintal3D());

    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    expect(second.result.current.status).toBe('ready');
    expect([worker.mock.calls.length, main.mock.calls.length]).toEqual([1, 0]);
  });

  it('si el worker no arranca, alterna con el hilo principal y nunca se rinde', async () => {
    vi.useFakeTimers();
    const worker = vi.fn((): Promise<Tintal3D> => Promise.reject(new Error('sin módulos en workers')));
    const main = vi.fn<() => Promise<Tintal3D>>().mockRejectedValueOnce(new Error('red caída')).mockResolvedValue(EMPTY_WORLD);
    resetTintal3D({ worker, main });
    const { result } = renderHook(() => useTintal3D());

    // worker ✗ → (500 ms) principal ✗ → (2 s) worker ✗ → (5 s) principal ✓
    await act(async () => {
      await vi.advanceTimersByTimeAsync((RETRY_3D_MS[0] ?? 0) + (RETRY_3D_MS[1] ?? 0) + (RETRY_3D_MS[2] ?? 0) + 10);
    });
    expect(result.current).toEqual({ status: 'ready', data: EMPTY_WORLD });
    expect([worker.mock.calls.length, main.mock.calls.length]).toEqual([2, 2]);
  });

  it('al reiniciar (pruebas) corta los reintentos en curso: un resultado viejo no se cuela', async () => {
    vi.useFakeTimers();
    let finish: (world: Tintal3D) => void = () => undefined;
    resetTintal3D({ worker: () => new Promise((resolve) => (finish = resolve)), main: () => Promise.reject(new Error('x')) });
    const { result } = renderHook(() => useTintal3D());
    worldPending();
    await act(async () => finish(EMPTY_WORLD));
    expect(result.current.status).toBe('loading');
  });
});
