// @vitest-environment node
// Protocolo del Web Worker de edificios: contesta con el mismo id, las teselas y TODOS sus buffers
// en la lista de transferencia; si los datos vienen rotos, contesta el error sin transferir nada.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { fakeSource, square } from './fixture';
import { isBuildReply, transferablesOf, type BuildReply, type BuildRequest } from './protocol';

const scope = { onmessage: null as ((event: { data: BuildRequest }) => void) | null, postMessage: vi.fn() };

beforeAll(async () => {
  vi.stubGlobal('self', scope);
  await import('./buildings.worker');
});
afterAll(() => vi.unstubAllGlobals());

function ask(request: BuildRequest): [BuildReply, ArrayBuffer[]] {
  scope.postMessage.mockClear();
  scope.onmessage?.({ data: request });
  expect(scope.postMessage).toHaveBeenCalledTimes(1);
  return scope.postMessage.mock.calls[0] as [BuildReply, ArrayBuffer[]];
}

describe('buildings.worker', () => {
  it('construye y transfiere los 7 buffers de cada tesela', () => {
    const source = fakeSource([{ rings: [square(0, 0, 10)], pisos: 2 }, { rings: [square(900, 0, 10)], pisos: 5 }]);
    const [reply, transfer] = ask({ id: 7, source });
    expect(isBuildReply(reply)).toBe(true);
    if (!reply.ok) throw new Error(reply.error);
    expect(reply.id).toBe(7);
    expect(reply.result.tiles).toHaveLength(2);
    expect(reply.result.stats).toMatchObject({ buildings: 2, tiles: 2, vertices: 28, triangles: 20 });
    expect(transfer).toHaveLength(14);
    expect(transfer).toEqual(transferablesOf(reply.result));
    expect(new Set(transfer).size).toBe(14); // cada arreglo con su propio buffer: nada se transfiere dos veces
  });

  it('respeta las opciones (tamaño de tesela)', () => {
    const source = fakeSource([{ rings: [square(0, 0, 10)], pisos: 2 }, { rings: [square(900, 0, 10)], pisos: 5 }]);
    const [reply] = ask({ id: 8, source, options: { tileSize: 2000 } });
    expect(reply.ok && reply.result.tiles.length).toBe(1);
  });

  it('con datos rotos contesta el error con su nombre, sin transferir nada', () => {
    const broken = { ...fakeSource([{ rings: [square(0, 0, 10)], pisos: 2 }]), anillos: undefined } as unknown as BuildRequest['source'];
    const [reply, transfer] = ask({ id: 9, source: broken });
    expect(reply).toMatchObject({ id: 9, ok: false, error: expect.stringMatching(/^TypeError: /) });
    expect(transfer).toEqual([]);
  });
});
