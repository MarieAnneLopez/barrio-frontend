// Cliente del hilo principal del worker de edificios: manda una copia de las columnas, valida la
// respuesta (mismo id y forma), termina el worker siempre y rechaza ante fallos o cancelación.
import { describe, expect, it } from 'vitest';
import { buildAll } from './builder';
import { buildInWorker, type WorkerLike } from './buildingsClient';
import { fakeSource, square } from './fixture';
import type { BuildRequest } from './protocol';

class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  sent: BuildRequest[] = [];
  private readonly reply: (worker: FakeWorker, request: BuildRequest) => void;
  constructor(reply: (worker: FakeWorker, request: BuildRequest) => void) {
    this.reply = reply;
  }
  postMessage(message: unknown) {
    this.sent.push(message as BuildRequest);
    queueMicrotask(() => this.reply(this, message as BuildRequest));
  }
  terminate() {
    this.terminated = true;
  }
}

const source = fakeSource([{ rings: [square(0, 0, 10)], pisos: 2 }]);
const answer = (make: (r: BuildRequest) => unknown) => (w: FakeWorker, r: BuildRequest) =>
  w.onmessage?.(new MessageEvent('message', { data: make(r) }));

describe('buildInWorker', () => {
  it('pide la construcción con las columnas y entrega las teselas del worker', async () => {
    const worker = new FakeWorker(answer((r) => ({ id: r.id, ok: true, result: buildAll(r.source, r.options) })));
    const result = await buildInWorker(source, { spawn: () => worker, options: { tileSize: 100 } });
    expect(result.stats).toMatchObject({ buildings: 1, tiles: 1 });
    expect(worker.sent[0]).toMatchObject({ source, options: { tileSize: 100 } });
    expect(worker.terminated).toBe(true);
  });

  it('rechaza el error del worker, una respuesta con otra forma u otro id', async () => {
    const failing = new FakeWorker(answer((r) => ({ id: r.id, ok: false, error: 'TypeError: anillos' })));
    await expect(buildInWorker(source, { spawn: () => failing })).rejects.toThrow(/anillos/);
    const odd = new FakeWorker(answer((r) => ({ id: r.id, ok: true, result: { tiles: [{ key: 1 }] } })));
    await expect(buildInWorker(source, { spawn: () => odd })).rejects.toThrow(/forma esperada/);
    const other = new FakeWorker(answer((r) => ({ id: r.id + 1, ok: false, error: 'x' })));
    await expect(buildInWorker(source, { spawn: () => other })).rejects.toThrow(/forma esperada/);
    expect([failing, odd, other].every((w) => w.terminated)).toBe(true);
  });

  it('rechaza si el worker no arranca, no contesta a tiempo o se cancela', async () => {
    await expect(buildInWorker(source, { spawn: () => { throw new Error('sin Worker'); } })).rejects.toThrow(/sin Worker/);
    const silent = new FakeWorker(() => undefined);
    await expect(buildInWorker(source, { spawn: () => silent, timeoutMs: 20 })).rejects.toThrow(/no respondió/);
    expect(silent.terminated).toBe(true);
    const abort = new AbortController();
    const slow = new FakeWorker(() => undefined);
    const pending = buildInWorker(source, { spawn: () => slow, signal: abort.signal });
    abort.abort();
    await expect(pending).rejects.toThrow(/cancelada/);
    expect(slow.terminated).toBe(true);
  });
});
