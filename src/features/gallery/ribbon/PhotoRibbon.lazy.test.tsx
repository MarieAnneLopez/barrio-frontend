import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { webgl } from './ribbonCanvasKit';
import { renderers } from './ribbonGlKit';
import { LABELS, mountRibbon } from './ribbonHarness';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock('./ribbonEngine');
  webgl.fail = false;
});

const grid = () => screen.queryByRole('list', { name: 'Fotos de la galería' });
const tiles = () => within(grid() as HTMLElement).getAllByRole('button');
/** El vigía que pide el motor: mira una pantalla más allá de la que se ve. */
const lookout = (watchers: { options?: unknown }[]) =>
  watchers.filter((watcher) => (watcher.options as { rootMargin?: string } | undefined)?.rootMargin === '100% 0px');

describe('PhotoRibbon: el motor WebGL llega aparte, y sin él queda la rejilla', () => {
  it('lejos de la pantalla no se pide: se ve la rejilla, con el sitio del lienzo ya reservado y oculto', async () => {
    const { root, settle, observers } = await mountRibbon({ far: true });
    await settle();
    expect(root()).toHaveAttribute('data-mode', 'pending');
    expect(tiles().map((tile) => tile.textContent)).toEqual(LABELS);
    expect(root().querySelector('.ribbon-frame')).toHaveAttribute('aria-hidden', 'true');
    expect(root().querySelector('canvas')).toBeNull();
    expect(renderers).toHaveLength(0);
    expect(lookout(observers.created.intersection)).toHaveLength(1);
  });

  it('axe: sin violaciones mientras se espera al motor', async () => {
    const { default: axe } = await import('axe-core');
    const { container } = await mountRibbon({ far: true });
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });

  it('al acercarse llega el motor, la rejilla deja su sitio a la cinta y el vigía se desconecta', async () => {
    const mounted = await mountRibbon({ far: true });
    await mounted.arrive();
    expect(mounted.root()).toHaveAttribute('data-mode', 'ribbon');
    expect(grid()).toBeNull();
    expect(mounted.group().querySelector('canvas')).not.toBeNull();
    const [watcher] = lookout(mounted.observers.created.intersection) as { disconnect?: unknown }[];
    expect(watcher?.disconnect).toHaveBeenCalled();
  });

  it('si el navegador no da un contexto WebGL, ni siquiera descarga el motor', async () => {
    const downloaded = vi.fn();
    vi.doMock('./ribbonEngine', () => {
      downloaded();
      return { createRibbonEngine: () => null };
    });
    const errors = vi.spyOn(console, 'error');
    const mounted = await mountRibbon({ far: true, before: () => { webgl.fail = true; } });
    await mounted.arrive();
    expect(mounted.root()).toHaveAttribute('data-mode', 'grid');
    expect(downloaded).not.toHaveBeenCalled();
    expect(document.querySelector('canvas')).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  it('si la descarga del motor falla, se queda con la rejilla', async () => {
    vi.doMock('./ribbonEngine', () => {
      throw new Error('sin red');
    });
    const mounted = await mountRibbon({ far: true });
    await mounted.arrive();
    expect(mounted.root()).toHaveAttribute('data-mode', 'grid');
    expect(tiles()).toHaveLength(LABELS.length);
    expect(mounted.root().querySelector('.ribbon-frame')).toBeNull();
  });

  it('si se pierde el contexto WebGL, cae a la rejilla de fotos', async () => {
    const { group } = await mountRibbon();
    expect(grid()).toBeNull();
    fireEvent(group().querySelector('canvas') as HTMLCanvasElement, new Event('webglcontextlost'));
    expect(grid()).not.toBeNull();
    expect(screen.queryByRole('group', { name: 'Fotos de la galería' })).toBeNull();
    expect(renderers[0]?.dispose).toHaveBeenCalledTimes(1);
  });
});
