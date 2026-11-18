import { LinearMipmapLinearFilter, SRGBColorSpace, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPhotoCache } from './ribbonTextures';

let decoding: { resolve: () => void; reject: () => void }[] = [];
beforeEach(() => {
  decoding = [];
  HTMLImageElement.prototype.decode = function decode() {
    return new Promise<void>((resolve, reject) => decoding.push({ resolve, reject }));
  };
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1280);
  vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(960);
});
afterEach(() => {
  Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
  vi.restoreAllMocks();
});
const settle = async () => {
  decoding.splice(0).forEach(({ resolve }) => resolve());
  await Promise.resolve();
  await Promise.resolve();
};

describe('texturas de las fotos', () => {
  it('se piden al necesitarlas y llegan decodificadas, en sRGB, con mipmaps y su proporción', async () => {
    const ready = vi.fn();
    const cache = createPhotoCache(4, 4, ready);
    expect(cache.get('/a-1280.webp')).toBeNull();
    await settle();
    const photo = cache.get('/a-1280.webp');
    expect(ready).toHaveBeenCalledTimes(1);
    expect(photo?.aspect).toBeCloseTo(4 / 3, 10);
    expect(photo?.texture.colorSpace).toBe(SRGBColorSpace);
    expect([photo?.texture.generateMipmaps, photo?.texture.minFilter, photo?.texture.anisotropy]).toEqual([true, LinearMipmapLinearFilter, 4]);
    expect((photo?.texture.image as HTMLImageElement).src).toMatch(/\/a-1280\.webp$/);
  });

  it('guarda solo las de uso más reciente y libera las demás', async () => {
    const freed = vi.spyOn(Texture.prototype, 'dispose');
    const cache = createPhotoCache(2, 1, () => undefined);
    ['/a', '/b'].forEach((src) => cache.get(src));
    await settle();
    cache.get('/a'); // la «a» se acaba de usar: la que sobra es la «b»
    cache.get('/c');
    expect(cache.size).toBe(2);
    expect(freed).toHaveBeenCalledTimes(1);
    expect(cache.get('/a')).not.toBeNull();
  });

  it('al liberar todo no queda ninguna textura, y una descarga tardía ya no crea nada', async () => {
    const freed = vi.spyOn(Texture.prototype, 'dispose');
    const ready = vi.fn();
    const cache = createPhotoCache(4, 1, ready);
    cache.get('/a');
    await settle();
    cache.get('/b');
    cache.dispose();
    await settle();
    expect(freed).toHaveBeenCalledTimes(1);
    expect(ready).toHaveBeenCalledTimes(1);
    expect(cache.size).toBe(0);
  });

  it('una foto que no carga se queda sin textura, sin romper nada', async () => {
    const cache = createPhotoCache(4, 1, () => undefined);
    cache.get('/rota');
    decoding.splice(0).forEach(({ reject }) => reject());
    await Promise.resolve();
    expect(cache.get('/rota')).toBeNull();
  });
});
