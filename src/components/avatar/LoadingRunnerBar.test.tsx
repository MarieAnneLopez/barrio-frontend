import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FINISH_MS, MIN_VISIBLE_MS, useLoadingProgress } from '../../hooks/useLoadingProgress';
import { readJson, STAGE, track } from '../../lib/loadingTracker';
import { loadingSnapshot, useLoadingStore } from '../../store/loadingStore';
import { LoadingRunnerBar } from './LoadingRunnerBar';

const store = () => useLoadingStore.getState();

beforeEach(() => act(() => useLoadingStore.setState({ tasks: {} })));
afterEach(() => vi.useRealTimers());

describe('Progreso real de las cargas (H24)', () => {
  it('promedia el lote, nunca retrocede y se vacía cuando todo termina', () => {
    const a = store().begin();
    const b = store().begin();
    store().update(a, 0.5);
    store().update(a, 0.2);
    expect(loadingSnapshot(store().tasks)).toEqual({ active: true, progress: 0.25 });
    store().end(a);
    expect(loadingSnapshot(store().tasks).progress).toBe(0.5);
    store().end(b);
    expect(loadingSnapshot(store().tasks)).toEqual({ active: false, progress: 1 });
  });

  it('lee el cuerpo por partes según Content-Length y calla en las rutas silenciosas', async () => {
    const body = JSON.stringify({ items: Array.from({ length: 50 }, (_, i) => i) });
    const response = new Response(body, { headers: { 'Content-Length': String(body.length) } });
    const seen: number[] = [];
    const data = await readJson<{ items: number[] }>(response, { stage: (v) => seen.push(v), done: () => undefined });
    expect(data.items).toHaveLength(50);
    expect(seen[0]).toBe(STAGE.headers);
    expect(seen.at(-1)).toBe(1);

    track('/chat').stage(0.5);
    track('/auth/session').done();
    expect(store().tasks).toEqual({});
    const tracker = track('/barberias');
    expect(Object.values(store().tasks)).toEqual([STAGE.sent]);
    tracker.done();
  });

  it('dura al menos 650 ms, marca 100 % y luego se oculta', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLoadingProgress());
    let id = 0;
    act(() => {
      id = store().begin();
      store().update(id, 0.4);
    });
    expect(result.current).toEqual({ visible: true, finishing: false, progress: 0.4 });
    act(() => store().end(id));
    act(() => vi.advanceTimersByTime(MIN_VISIBLE_MS - 50));
    expect(result.current).toEqual({ visible: true, finishing: false, progress: 1 });
    act(() => vi.advanceTimersByTime(60));
    expect(result.current.finishing).toBe(true);
    act(() => vi.advanceTimersByTime(FINISH_MS));
    expect(result.current.visible).toBe(false);
  });

  it('la barra expone su avance, no captura clics y Mini Marie corre', () => {
    render(<LoadingRunnerBar />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    act(() => {
      const id = store().begin();
      store().update(id, 0.6);
    });
    const bar = screen.getByRole('progressbar', { name: 'Cargando' });
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveClass('pointer-events-none');
    expect(bar.querySelector('.avatar')).toHaveAttribute('data-state', 'run');
    expect(bar.querySelector<HTMLElement>('.loading-bar__fill')?.style.transform).toBe('scaleX(0.6)');
  });
});
