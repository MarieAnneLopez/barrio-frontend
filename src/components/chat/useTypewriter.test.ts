import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTypewriter } from './useTypewriter';

afterEach(() => vi.useRealTimers());

describe('useTypewriter', () => {
  it('revela el texto por partes hasta completarlo', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypewriter('Hola barrio', true));
    expect(result.current).toBe('');

    act(() => vi.advanceTimersByTime(16));
    expect(result.current).toBe('Ho');
    // Cada paso programa el siguiente en su efecto: un act por paso.
    for (let step = 0; step < 6; step += 1) act(() => vi.advanceTimersByTime(16));
    expect(result.current).toBe('Hola barrio');
  });

  it('sin animación devuelve el texto completo desde el inicio', () => {
    const { result } = renderHook(() => useTypewriter('Hola barrio', false));
    expect(result.current).toBe('Hola barrio');
  });
});
