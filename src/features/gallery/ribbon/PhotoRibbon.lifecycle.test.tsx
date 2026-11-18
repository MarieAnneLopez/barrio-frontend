import { act, fireEvent } from '@testing-library/react';
import { BufferGeometry, Material, type Mesh, type Scene, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderers, restoreHidden, setHidden } from './ribbonGlKit';
import { mountRibbon } from './ribbonHarness';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => {
  vi.restoreAllMocks();
  restoreHidden();
});

describe('PhotoRibbon con WebGL: vida del lienzo', () => {
  it('lienzo transparente y sin búferes de sobra, con el pixel ratio limitado a 1,5', async () => {
    const { painted } = await mountRibbon({ before: () => vi.stubGlobal('devicePixelRatio', 3) });
    expect(renderers).toHaveLength(1);
    expect(painted.requested).toContainEqual(['webgl2', { alpha: true, antialias: false, depth: false, stencil: false }]);
    expect(renderers[0]?.parameters).toMatchObject({ alpha: true, antialias: false });
    expect(renderers[0]?.setPixelRatio).toHaveBeenCalledWith(1.5);
    expect(renderers[0]?.setSize).toHaveBeenLastCalledWith(1440, 836, false);
  });

  it('solo pide cuadros mientras se ve y se mueve: quieta o fuera de pantalla no queda ninguno', async () => {
    const { frames, observers, advance, hit } = await mountRibbon();
    advance(2);
    expect(renderers[0]?.render).toHaveBeenCalled();
    expect(frames.pending.size).toBe(0); // quieta
    act(() => hit(0).focus());
    fireEvent.keyDown(hit(0), { key: 'ArrowRight' });
    expect(frames.pending.size).toBe(1);
    advance(150);
    expect(frames.pending.size).toBe(0); // ya llegó
    act(() => observers.show(false));
    fireEvent.keyDown(hit(1), { key: 'ArrowRight' });
    expect(frames.pending.size).toBe(0);
    act(() => observers.show(true));
    expect(frames.pending.size).toBe(1);
  });

  it('con la pestaña oculta se pausa, y al volver el primer cuadro no acumula el tiempo parado', async () => {
    const { frames, hit } = await mountRibbon();
    act(() => setHidden(true));
    fireEvent.keyDown(hit(0), { key: 'ArrowRight' });
    expect(frames.pending.size).toBe(0);
    act(() => setHidden(false));
    expect(frames.pending.size).toBe(1);
  });

  it('al desmontar libera renderer, contexto, geometrías, materiales, texturas, observers, oyentes y rAF', async () => {
    const [added, removed] = [vi.spyOn(EventTarget.prototype, 'addEventListener'), vi.spyOn(EventTarget.prototype, 'removeEventListener')];
    const stopWatching = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const { group, unmount, frames, observers, advance } = await mountRibbon();
    advance(2);
    const scene = renderers[0]?.render.mock.calls.at(-1)?.[0] as Scene;
    const meshes = scene.children.filter((child) => (child as Mesh).isMesh).length;
    const freed = [BufferGeometry, Material, Texture].map((kind) => vi.spyOn(kind.prototype, 'dispose'));
    const [frame, canvas, renderer] = [group(), group().querySelector('canvas'), renderers[0]];
    const own = (spy: typeof added) => spy.mock.calls
      .filter(([type], call) => [frame, canvas].includes(spy.mock.contexts[call] as HTMLElement) || type === 'visibilitychange')
      .map(([type, listener]) => `${type}:${added.mock.calls.findIndex(([, known]) => known === listener)}`).sort();
    unmount();

    expect(renderer?.dispose).toHaveBeenCalledTimes(1);
    expect(renderer?.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(canvas?.isConnected).toBe(false);
    expect(meshes).toBeGreaterThanOrEqual(4); // el suelo y las ranuras
    expect(freed.map((spy) => spy.mock.calls.length)).toEqual([2, meshes, meshes - 1]); // planos, materiales, etiquetas
    expect(frames.pending.size).toBe(0);
    for (const watcher of [...observers.created.intersection, ...observers.created.resize]) expect(watcher.disconnect).toHaveBeenCalledTimes(1);
    expect(stopWatching).toHaveBeenCalled();
    expect(own(added).length).toBeGreaterThanOrEqual(11); // puntero, clic, rueda, foco, contexto perdido y visibilidad
    expect(own(removed)).toEqual(own(added));
  });

  it('en modo estricto (doble montaje) queda un solo lienzo y un solo contexto vivo', async () => {
    const { root } = await mountRibbon({ strict: true });
    expect(renderers.filter((renderer) => renderer.forceContextLoss.mock.calls.length === 0)).toHaveLength(1);
    expect(root().querySelectorAll('canvas')).toHaveLength(1);
  });
});
