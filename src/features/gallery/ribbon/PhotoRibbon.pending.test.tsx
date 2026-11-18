import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountRibbon, PHOTOS } from './ribbonHarness';
import type { RibbonPhoto } from './ribbonPhotos';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

/** 21 fotos: las 7 del arnés, tres veces, con claves propias. */
const MANY: RibbonPhoto[] = [0, 1, 2].flatMap((round) => PHOTOS.map((photo) => ({ ...photo, key: `${photo.key}-${round}` })));
const tiles = () => document.querySelectorAll('.ribbon-tile');

// TBT de Galería (D117): con 208 fotos, montar la rejilla entera (figura, foto, texto y crédito de
// cada una) solo para el rato en que llega el motor era una tarea de 262 ms con la CPU de un celular.
describe('PhotoRibbon: la rejilla mientras llega el motor', () => {
  it('mientras llega el motor muestra solo las primeras 12 fotos', async () => {
    const mounted = await mountRibbon({ photos: MANY, far: true });
    expect(mounted.root()).toHaveAttribute('data-mode', 'pending');
    expect(tiles()).toHaveLength(12);
  });

  it('si la descarga del motor falla, la rejilla definitiva tiene todas', async () => {
    vi.doMock('./ribbonEngine', () => {
      throw new Error('sin red');
    });
    const mounted = await mountRibbon({ photos: MANY, far: true });
    await mounted.arrive();
    expect(mounted.root()).toHaveAttribute('data-mode', 'grid');
    expect(tiles()).toHaveLength(MANY.length);
  });
});
