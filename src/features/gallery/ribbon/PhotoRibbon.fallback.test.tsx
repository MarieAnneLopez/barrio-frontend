import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderers } from './ribbonGlKit';
import { mountRibbon } from './ribbonHarness';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

/** Lo que three pasa a `debug.onShaderError` cuando un programa no enlaza. */
const gl = { getProgramInfoLog: () => 'no enlaza', getShaderInfoLog: () => 'ERROR: 0:1' };

describe('PhotoRibbon con WebGL: si la GPU no puede con la cinta', () => {
  it('un shader que no compila no deja la cinta en blanco: cae a la rejilla y lo dice en la consola', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { root } = await mountRibbon();
    const renderer = renderers[0];
    expect(renderer?.debug.onShaderError).toEqual(expect.any(Function));
    act(() => renderer?.debug.onShaderError?.(gl, {}, {}, {}));
    expect(root()).toHaveAttribute('data-mode', 'grid');
    expect(screen.getByRole('list', { name: 'Fotos de la galería' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Fotos de la galería' })).toBeNull();
    expect(renderer?.dispose).toHaveBeenCalledTimes(1);
    expect(errors).toHaveBeenCalledTimes(1);
    expect(String(errors.mock.calls[0])).toMatch(/ERROR: 0:1/);
  });
});
