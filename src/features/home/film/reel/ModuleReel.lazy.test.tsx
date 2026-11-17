import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gl } from './glKit';
import { mountReel } from './reelHarness';

vi.mock('three', async (original) => (await import('./glKit')).fakeThree(original));
afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock('./reelEngine');
});

const NAME = 'Los 14 módulos del barrio';
const grid = () => screen.queryByRole('navigation', { name: NAME });
const links = () => within(grid() as HTMLElement).getAllByRole('link');
/** El vigía que pide el motor: mira una pantalla más allá de la que se ve (el header tiene el suyo propio). */
const lookout = (watchers: { options: unknown }[]) =>
  watchers.filter((watcher) => (watcher.options as { rootMargin?: string } | undefined)?.rootMargin === '100% 0px');

// El motor (three) no va en el trozo inicial: se descarga cuando el capítulo se acerca o alguien lo toca.
describe('ModuleReel: el motor WebGL llega aparte', () => {
  it('lejos de la pantalla no se pide: se ve la rejilla, con el sitio del lienzo ya reservado', async () => {
    const { section, settle, observers } = await mountReel({ far: true });
    await settle();
    expect(section()).toHaveAttribute('data-mode', 'pending');
    expect(links()).toHaveLength(14);
    expect(screen.queryByRole('group', { name: NAME })).toBeNull();
    expect(section().querySelector('.reel-frame')).toHaveAttribute('aria-hidden', 'true');
    expect(section().querySelector('canvas')).toBeNull();
    expect(gl.renderers).toHaveLength(0);
    expect(lookout(observers.created.intersection)).toHaveLength(1);
  });

  it('axe: sin violaciones mientras se espera al motor (rejilla visible y lienzo oculto)', async () => {
    const { default: axe } = await import('axe-core');
    const { container } = await mountReel({ far: true });
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });

  it('al acercarse el capítulo llega el motor y la rejilla deja su sitio al lienzo', async () => {
    const mounted = await mountReel({ far: true });
    await mounted.arrive();
    expect(mounted.section()).toHaveAttribute('data-mode', 'reel');
    expect(grid()).toBeNull();
    expect(mounted.reel().querySelector('canvas')).not.toBeNull();
    expect(mounted.reel()).not.toHaveAttribute('aria-hidden');
    expect(gl.renderers).toHaveLength(1);
    const [watcher] = lookout(mounted.observers.created.intersection) as { disconnect?: unknown }[];
    expect(watcher?.disconnect).toHaveBeenCalled(); // ya no hace falta vigilar
  });

  it.each([
    ['el puntero entra en el capítulo', (node: HTMLElement) => fireEvent.pointerEnter(node)],
    ['el foco entra en la rejilla', (node: HTMLElement) => fireEvent.focus(node.querySelector('a') as HTMLElement)],
  ])('también lo pide el primer gesto: %s', async (_name, gesture) => {
    const { section, settle } = await mountReel({ far: true });
    gesture(section());
    await settle();
    expect(section()).toHaveAttribute('data-mode', 'reel');
    expect(gl.renderers).toHaveLength(1);
  });

  it('si el foco estaba en un enlace de la rejilla, al llegar el motor pasa al reel y no se pierde', async () => {
    const mounted = await mountReel({ far: true });
    act(() => links()[4]?.focus());
    expect(links()[4]).toHaveFocus();
    await mounted.settle();
    expect(mounted.reel()).toHaveFocus();
  });

  it('con el foco en otra parte, el cambio no se lo lleva', async () => {
    const mounted = await mountReel({ far: true });
    await mounted.arrive();
    expect(document.body).toHaveFocus();
  });

  it('si el navegador no da un contexto WebGL, ni siquiera descarga el motor', async () => {
    const downloaded = vi.fn();
    vi.doMock('./reelEngine', () => {
      downloaded();
      return { createReelEngine: () => null };
    });
    const mounted = await mountReel({ far: true, before: () => { gl.fail = true; } });
    await mounted.arrive();
    expect(mounted.section()).toHaveAttribute('data-mode', 'grid');
    expect(downloaded).not.toHaveBeenCalled();
  });

  it('si la descarga del motor falla, se queda con la rejilla y sin recorrido', async () => {
    vi.doMock('./reelEngine', () => {
      throw new Error('sin red');
    });
    const mounted = await mountReel({ far: true });
    await mounted.arrive();
    expect(mounted.section()).toHaveAttribute('data-mode', 'grid');
    expect(links()).toHaveLength(14);
    expect(mounted.section().querySelector('.reel-frame')).toBeNull();
    expect(gl.renderers).toHaveLength(0);
  });
});
