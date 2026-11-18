import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { layoutFor } from './ribbonGeometry';
import { mountRibbon } from './ribbonHarness';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

const tiles = () => within(screen.getByRole('list', { name: 'Fotos de la galería' })).getAllByRole('button');
const { pitch, unitsPerPixel } = layoutFor(1440, 836);

describe('PhotoRibbon con WebGL: el foco nunca se pierde ni se esconde', () => {
  it('si al llegar el motor el foco estaba en una tesela, la cinta empieza en esa foto y el foco va a su botón', async () => {
    const mounted = await mountRibbon({ far: true });
    act(() => tiles()[3]?.focus());
    await mounted.arrive();
    expect(mounted.hit(3)).toHaveFocus();
    mounted.advance();
    expect(mounted.live()).toHaveTextContent(/^Foto 4 de/);
  });

  it('si el foco estaba en otro sitio (el enlace de créditos), al llegar el motor no se lo lleva', async () => {
    const mounted = await mountRibbon({ far: true });
    const credits = screen.getByRole('link', { name: 'Créditos de fotos' });
    act(() => credits.focus());
    await mounted.arrive();
    expect(credits).toHaveFocus();
  });

  it('si se pierde el contexto WebGL con el foco en una foto, el foco pasa a su tesela de la rejilla', async () => {
    const { hit, group } = await mountRibbon();
    act(() => hit(2).focus());
    fireEvent(group().querySelector('canvas') as HTMLCanvasElement, new Event('webglcontextlost'));
    expect(tiles()[2]).toHaveFocus();
  });

  it('si la foto enfocada sale de la pantalla (con la rueda o el arrastre), el foco pasa a la del centro', async () => {
    const { hit, group, advance } = await mountRibbon();
    act(() => hit(0).focus());
    fireEvent.wheel(group(), { deltaY: (3 * pitch) / unitsPerPixel / 0.8 });
    advance();
    expect(hit(0)).toHaveAttribute('data-parked', 'true');
    expect(hit(3)).toHaveFocus();
  });
});
