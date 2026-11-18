import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSceneModule, type SceneModule } from './sceneModule';

const fake = { default: () => null } as unknown as SceneModule;

afterEach(() => vi.useRealTimers());

describe('useSceneModule: el código de la maqueta sin pantalla de carga (D112)', () => {
  it('devuelve null mientras llega y luego el módulo, sin suspender', async () => {
    const load = vi.fn(() => Promise.resolve(fake));
    const { result } = renderHook(() => useSceneModule(load, []));
    expect(result.current).toBeNull();
    await act(async () => undefined);
    expect(result.current).toBe(fake);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('si la red falla, reintenta sola con las esperas dadas', async () => {
    vi.useFakeTimers();
    const load = vi.fn<() => Promise<SceneModule>>()
      .mockRejectedValueOnce(new Error('red'))
      .mockResolvedValueOnce(fake);
    const { result } = renderHook(() => useSceneModule(load, [500]));
    await act(async () => undefined);
    expect(result.current).toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(fake);
  });

  it('agotados los reintentos se queda en null (el esqueleto sigue a la vista)', async () => {
    const load = vi.fn(() => Promise.reject(new Error('red')));
    const { result } = renderHook(() => useSceneModule(load, []));
    await act(async () => undefined);
    expect(result.current).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
