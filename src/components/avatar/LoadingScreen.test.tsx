import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { remainingVisible, SCREEN_LEAVE_MS } from '../../hooks/useLoadingScreen';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { useLoadingStore } from '../../store/loadingStore';
import { setViewport } from '../../test/renderRoute';
import { LoadingScreen } from './LoadingScreen';

const status = () => screen.queryByRole('status');
const runner = () => status()?.querySelector<HTMLElement>('.sequence[data-sequence="run"]');
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'loading-screen.css'), 'utf8');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  useLoadingStore.setState({ tasks: {} });
  useLoadingScreenStore.setState({ lazy: 0, visible: false });
  setViewport(true);
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
    expect(runner()).not.toBeNull();
    expect(useLoadingScreenStore.getState().visible).toBe(true);

    act(() => void vi.advanceTimersByTime(650)); // red en silencio, pero aún no 700 ms
    expect(status()).not.toHaveAttribute('data-leaving');
    act(() => void vi.advanceTimersByTime(100));
    expect(status()).toHaveAttribute('data-leaving');
    act(() => void vi.advanceTimersByTime(SCREEN_LEAVE_MS));
    expect(status()).toBeNull();
    expect(useLoadingScreenStore.getState().visible).toBe(false);
  });

  it.each([['amplia', true, '196px', '420px'], ['pequeña', false, '98px', '210px']])(
    'en pantalla %s corre a escala entera (D86)', (_view, roomy, width, height) => {
      setViewport(roomy);
      render(<LoadingScreen />);
      expect([runner()?.style.width, runner()?.style.height]).toEqual([width, height]);
      // El escenario sabe su alto: el sol se queda por encima de su cabeza (loadingSun.test.ts).
      expect(status()?.querySelector<HTMLElement>('.loading-screen__stage')?.style.getPropertyValue('--runner')).toBe(height);
    });

  it('va en crema con suelo marrón: sin ladrillo, esquinas de píxel ni fuente de píxel (D96)', () => {
    render(<LoadingScreen />);
    expect(status()?.outerHTML).not.toMatch(/brick-|px-corners/);
    expect(css).not.toMatch(/--palette-|--ff-pixel|#fff|shadow/);
    expect(css).toMatch(/\.loading-screen \{[^}]*background-color: var\(--bg-primary\)/);
    expect(css).toMatch(/\.loading-screen__ground \{[^}]*height: 1px;[^}]*var\(--border-ink\)/);
  });

  // Auditoría MM-06: .sequence es inline-block y su hijo va en absoluto, así que su línea base es su
  // borde inferior; sin line-height 0 se apoyaba sobre el hueco del interlineado (~9 px a 16 px × 1,6).
  it('corre con los pies en el suelo: la pista no deja hueco de interlineado bajo ella', () => {
    expect(css).toMatch(/\.loading-screen__track \{[^}]*line-height: 0;/);
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

  it('aparece en toda petición de datos, no solo al arrancar (pedido de Marie)', () => {
    render(<LoadingScreen />);
    for (const ms of [200, 600, SCREEN_LEAVE_MS]) act(() => void vi.advanceTimersByTime(ms)); // arranque
    expect(status()).toBeNull();

    let id = 0;
    act(() => void (id = useLoadingStore.getState().begin()));
    expect(status()).toBeInTheDocument();
    act(() => useLoadingStore.getState().end(id));
    act(() => void vi.advanceTimersByTime(700));
    act(() => void vi.advanceTimersByTime(SCREEN_LEAVE_MS));
    expect(status()).toBeNull();
  });
});
