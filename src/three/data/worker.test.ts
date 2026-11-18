// @vitest-environment node
// El Web Worker (tintal3d.worker.ts): carga desde la base que recibe y contesta con los datos,
// transfiriendo sus buffers, o con el error (nombre y mensaje) sin transferir nada.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { FormatError } from './container';

const load = vi.hoisted(() => vi.fn());
vi.mock('./loadTintal3D', () => ({ loadTintal3D: load, transferables: () => ['buffers'] }));

const scope = { onmessage: null as ((event: { data: { base: string } }) => void) | null, postMessage: vi.fn() };

beforeAll(async () => {
  vi.stubGlobal('self', scope);
  await import('./tintal3d.worker');
});
afterAll(() => vi.unstubAllGlobals());

async function ask(base: string): Promise<unknown[]> {
  scope.postMessage.mockClear();
  scope.onmessage?.({ data: { base } });
  await vi.waitFor(() => expect(scope.postMessage).toHaveBeenCalledTimes(1));
  return scope.postMessage.mock.calls[0] ?? [];
}

describe('tintal3d.worker', () => {
  it('carga desde la base recibida y transfiere los buffers de los datos', async () => {
    load.mockResolvedValueOnce({ edificios: { count: 1 } });
    expect(await ask('https://tintal.test/data/tintal/')).toEqual([{ ok: true, data: { edificios: { count: 1 } } }, ['buffers']]);
    expect(load).toHaveBeenLastCalledWith('https://tintal.test/data/tintal/');
  });

  it('contesta el error con su nombre y mensaje, sin transferir nada', async () => {
    load.mockRejectedValueOnce(new FormatError('suelo cortado'));
    expect(await ask('https://tintal.test/data/tintal/')).toEqual([{ ok: false, error: 'FormatError: suelo cortado' }, []]);
    load.mockRejectedValueOnce('sin red');
    expect(await ask('https://tintal.test/data/tintal/')).toEqual([{ ok: false, error: 'sin red' }, []]);
  });
});
