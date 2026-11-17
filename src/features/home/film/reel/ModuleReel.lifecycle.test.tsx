import { act, fireEvent, screen } from '@testing-library/react';
import { BufferGeometry, Material, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gl } from './glKit';
import { mountReel } from './reelHarness';

vi.mock('three', async (original) => (await import('./glKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

const grid = () => screen.queryByRole('navigation', { name: 'Los 14 módulos del barrio' });

describe('ModuleReel con WebGL: vida del lienzo', () => {
  it('lienzo transparente y sin búferes de sobra, con el pixel ratio limitado a 2', async () => {
    const { painted } = await mountReel({ before: () => vi.stubGlobal('devicePixelRatio', 3) });
    expect(gl.renderers).toHaveLength(1);
    expect(painted.requested).toContainEqual(['webgl2', { alpha: true, antialias: false, depth: false, stencil: false }]);
    expect(gl.renderers[0]?.parameters).toMatchObject({ alpha: true, antialias: false });
    expect(gl.renderers[0]?.setPixelRatio).toHaveBeenCalledWith(2);
    expect(gl.renderers[0]?.setSize).toHaveBeenLastCalledWith(1440, 836, false);
  });

  it('publica en el escenario el tamaño de la tarjeta central y el hueco a sus lados, para el titular', async () => {
    const { section, unmount } = await mountReel();
    const stage = section().querySelector('.reel-stage') as HTMLElement;
    const read = () => ['--reel-card-w', '--reel-card-h', '--reel-room'].map((name) => stage.style.getPropertyValue(name));
    expect(read()).toEqual(['532.8px', '382.2px', '453.6px']); // 37 % de 1440 px
    unmount();
    expect(read()).toEqual(['', '', '']);
  });

  it('solo dibuja mientras se ve: fuera de pantalla no queda ningún cuadro pedido', async () => {
    const { frames, observers, advance } = await mountReel();
    advance(3);
    expect(gl.renderers[0]?.render).toHaveBeenCalledTimes(3);
    act(() => observers.show(false));
    expect(frames.pending.size).toBe(0);
    advance(3);
    expect(gl.renderers[0]?.render).toHaveBeenCalledTimes(3);
    act(() => observers.show(true));
    expect(frames.pending.size).toBe(1);
  });

  it('al desmontar libera renderer, contexto, geometría, materiales, texturas, observers, oyentes y rAF', async () => {
    const [added, removed] = [vi.spyOn(EventTarget.prototype, 'addEventListener'), vi.spyOn(EventTarget.prototype, 'removeEventListener')];
    const stopWatching = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const { reel, unmount, frames, observers } = await mountReel();
    const freed = [BufferGeometry, Material, Texture].map((kind) => vi.spyOn(kind.prototype, 'dispose'));
    const [frame, canvas, renderer] = [reel(), reel().querySelector('canvas'), gl.renderers[0]];
    const own = (spy: typeof added) => spy.mock.calls
      .filter(([type], call) => [frame, canvas].includes(spy.mock.contexts[call] as HTMLElement) || type === 'visibilitychange')
      .map(([type, listener]) => `${type}:${added.mock.calls.findIndex(([, known]) => known === listener)}`).sort();
    unmount();

    expect(renderer?.dispose).toHaveBeenCalledTimes(1);
    expect(renderer?.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(canvas?.isConnected).toBe(false);
    expect(freed.map((spy) => spy.mock.calls.length)).toEqual([1, 14, 14]);
    expect(frames.pending.size).toBe(0);
    for (const watcher of [...observers.created.intersection, ...observers.created.resize]) expect(watcher.disconnect).toHaveBeenCalledTimes(1);
    expect(stopWatching).toHaveBeenCalled();
    expect(own(added).length).toBeGreaterThanOrEqual(9); // puntero, clic, rueda, contexto perdido y visibilidad
    expect(own(removed)).toEqual(own(added));
  });

  it('en modo estricto (doble montaje) queda un solo lienzo y un solo contexto vivo', async () => {
    const { reel } = await mountReel({ strict: true });
    const alive = gl.renderers.filter((renderer) => renderer.forceContextLoss.mock.calls.length === 0);
    expect(alive).toHaveLength(1);
    expect(reel().querySelectorAll('canvas')).toHaveLength(1);
  });

  it('si se pierde el contexto WebGL, cae a la rejilla de enlaces', async () => {
    const { reel } = await mountReel();
    expect(grid()).toBeNull();
    fireEvent(reel().querySelector('canvas') as HTMLCanvasElement, new Event('webglcontextlost'));
    expect(grid()).not.toBeNull();
    expect(screen.queryByRole('group', { name: 'Los 14 módulos del barrio' })).toBeNull();
    expect(gl.renderers[0]?.dispose).toHaveBeenCalledTimes(1);
  });

  it('si el navegador no da el contexto, se queda con la rejilla sin romper la página ni ensuciar la consola', async () => {
    const errors = vi.spyOn(console, 'error');
    const { section } = await mountReel({ before: () => { gl.fail = true; } });
    expect(gl.renderers).toHaveLength(0);
    expect(section()).toHaveAttribute('data-mode', 'grid');
    expect(grid()).not.toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });
});
