import { afterEach, describe, expect, it, vi } from 'vitest';
import { WAKE_PATH, wakeBackend } from './wakeBackend';

afterEach(() => vi.unstubAllGlobals());

describe('despertador de la API (D91)', () => {
  it('en el sitio publicado pide /api/_wake una vez, sin credenciales y sin leer la respuesta', () => {
    const request = vi.fn(async () => new Response(null));
    vi.stubGlobal('fetch', request);
    wakeBackend('reconoce-el-tintal.pages.dev');
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(WAKE_PATH, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' });
    expect(WAKE_PATH).toBe('/api/_wake');
  });

  it.each(['localhost', '127.0.0.1', '[::1]'])('en %s no pide nada: la API local no se duerme', (host) => {
    const request = vi.fn(async () => new Response(null));
    vi.stubGlobal('fetch', request);
    wakeBackend(host);
    expect(request).not.toHaveBeenCalled();
  });

  it('si la petición falla no rompe nada ni deja una promesa rechazada', async () => {
    const rejected = vi.fn();
    process.on('unhandledRejection', rejected);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network'); }));
    expect(() => wakeBackend('reconoce-el-tintal.pages.dev')).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 10));
    process.off('unhandledRejection', rejected);
    expect(rejected).not.toHaveBeenCalled();
  });
});
