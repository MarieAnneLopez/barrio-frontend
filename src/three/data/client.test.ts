// Cliente del hilo principal: crea el Web Worker, le pasa la URL base y entrega su respuesta.
import { afterEach, describe, expect, it } from 'vitest';
import { clearTintal3DCache, loadTintal3DInWorker, tintalDataBase, type WorkerLike } from './tintal3dClient';

class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  sent: unknown[] = [];
  private readonly reply: (worker: FakeWorker) => void;
  constructor(reply: (worker: FakeWorker) => void) {
    this.reply = reply;
  }
  postMessage(message: unknown) {
    this.sent.push(message);
    queueMicrotask(() => this.reply(this));
  }
  terminate() {
    this.terminated = true;
  }
}

const answer = (data: unknown) => (w: FakeWorker) => w.onmessage?.(new MessageEvent('message', { data }));

afterEach(() => clearTintal3DCache());

describe('loadTintal3DInWorker', () => {
  it('manda la carpeta de datos del mismo origen y devuelve lo que decodificó el worker', async () => {
    const workers: FakeWorker[] = [];
    const spawn = () => {
      const w = new FakeWorker(answer({ ok: true, data: { edificios: { count: 7 } } }));
      workers.push(w);
      return w;
    };
    const data = await loadTintal3DInWorker(spawn);
    expect(data.edificios.count).toBe(7);
    expect(workers[0]?.sent).toEqual([{ base: tintalDataBase() }]);
    expect(workers[0]?.terminated).toBe(true);
    expect(tintalDataBase()).toMatch(/\/data\/tintal\/$/);
  });

  it('pide los datos una sola vez por sesión', async () => {
    let spawned = 0;
    const spawn = () => {
      spawned += 1;
      return new FakeWorker(answer({ ok: true, data: { edificios: { count: 1 } } }));
    };
    await Promise.all([loadTintal3DInWorker(spawn), loadTintal3DInWorker(spawn)]);
    expect(spawned).toBe(1);
  });

  it('rechaza con el mensaje del worker y no deja el fallo en caché', async () => {
    const failing = () => new FakeWorker(answer({ ok: false, error: 'FormatError: suelo' }));
    await expect(loadTintal3DInWorker(failing)).rejects.toThrow(/suelo/);
    const ok = () => new FakeWorker(answer({ ok: true, data: { edificios: { count: 2 } } }));
    await expect(loadTintal3DInWorker(ok)).resolves.toMatchObject({ edificios: { count: 2 } });
  });

  it('rechaza si el worker no arranca (error de carga del módulo)', async () => {
    const broken = () => new FakeWorker((w) => w.onerror?.(new ErrorEvent('error', { message: 'sin módulo' })));
    await expect(loadTintal3DInWorker(broken)).rejects.toThrow(/sin módulo/);
  });
});
