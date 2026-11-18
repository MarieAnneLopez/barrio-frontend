import { act, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { layoutFor } from './ribbonGeometry';
import { mountRibbon } from './ribbonHarness';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

const { pitch, unitsPerPixel } = layoutFor(1440, 836);
/** Píxeles de rueda que, × 0,8, avanzan una foto. */
const ONE_PHOTO = pitch / unitsPerPixel / 0.8;

describe('PhotoRibbon con WebGL: la rueda', () => {
  it('la vertical mueve la cinta (delta × 0,8) sin cancelar el scroll de la página', async () => {
    const { group, advance, live } = await mountRibbon();
    expect(fireEvent.wheel(group(), { deltaY: ONE_PHOTO })).toBe(true);
    advance();
    expect(live()).toHaveTextContent(/^Foto 2 de/);
  });

  it('el gesto horizontal de un panel táctil mueve la cinta y no se le deja al navegador («atrás» del historial)', async () => {
    const { group, advance, live } = await mountRibbon();
    expect(fireEvent.wheel(group(), { deltaX: ONE_PHOTO, deltaY: 3 })).toBe(false);
    advance();
    expect(live()).toHaveTextContent(/^Foto 2 de/);
  });

  it('con movimiento reducido la cinta no usa la rueda, tampoco la horizontal: no la cancela', async () => {
    const { group, frames, live } = await mountRibbon({ reducedMotion: true });
    expect(fireEvent.wheel(group(), { deltaX: 4 * ONE_PHOTO })).toBe(true);
    act(() => void frames.run(1));
    expect(live()).toHaveTextContent(/^Foto 1 de/);
  });
});
