import { act, renderHook } from '@testing-library/react';
import type { WebGLRenderer } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RECOVERY_MS, useContextRecovery } from './contextRecovery';

afterEach(() => vi.useRealTimers());

const fakeGl = () => {
  const canvas = document.createElement('canvas');
  return { canvas, gl: { domElement: canvas } as unknown as WebGLRenderer };
};
const lose = (canvas: HTMLCanvasElement) => {
  const event = new Event('webglcontextlost', { cancelable: true });
  canvas.dispatchEvent(event);
  return event;
};

describe('recuperación del contexto WebGL', () => {
  it('al perderse el contexto vuelve a montar el lienzo, sin botón', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useContextRecovery());
    const { canvas, gl } = fakeGl();
    act(() => result.current.onCreated({ gl }));
    const event = lose(canvas);
    expect(event.defaultPrevented).toBe(true);
    expect(result.current.key).toBe(0);
    act(() => vi.advanceTimersByTime(RECOVERY_MS[0] ?? 0));
    expect(result.current.key).toBe(1);
  });

  it('si vuelve a fallar enseguida, espera cada vez más', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useContextRecovery());
    for (let i = 0; i < 3; i++) {
      const { canvas, gl } = fakeGl();
      act(() => result.current.onCreated({ gl }));
      lose(canvas);
      act(() => vi.advanceTimersByTime((RECOVERY_MS[i] ?? 0) - 1));
      expect(result.current.key).toBe(i);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.key).toBe(i + 1);
    }
  });
});
