// @vitest-environment node
// Descarga y decodificación de los cuatro archivos (lo que hace el Web Worker), con un fetch falso
// que sirve el fixture del codificador.
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { buildFixture, type FixtureFile } from '../../../scripts/datos3d/fixture.mjs';
import { gunzip } from './gunzip';
import { loadTintal3D, transferables } from './loadTintal3D';

const files = buildFixture();
const KINDS: FixtureFile[] = ['edificios', 'vias', 'suelo', 'puntos'];
const manifest = (sizes: Partial<Record<FixtureFile, number>> = {}) => ({
  version: 1,
  archivos: Object.fromEntries(
    KINDS.map((k) => [k, { ruta: `${k}.bin.gz`, sha256: `abc${k}`, bytesTnt3: sizes[k] ?? gunzipSync(files[k]).length }]),
  ),
});

function fakeFetch(body: (name: string) => Uint8Array<ArrayBuffer>, info = manifest()) {
  const asked: string[] = [];
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    asked.push(url.pathname + url.search);
    const name = url.pathname.split('/').pop() ?? '';
    if (name === 'manifest.json') return new Response(JSON.stringify(info));
    return new Response(body(name.replace('.bin.gz', '')));
  }) as typeof fetch;
  return { fetcher, asked };
}

describe('loadTintal3D', () => {
  it('pide el manifiesto y los cuatro archivos del mismo origen, con su versión en la URL', async () => {
    const { fetcher, asked } = fakeFetch((k) => files[k as FixtureFile]);
    const data = await loadTintal3D('https://tintal.test/data/tintal/', fetcher);
    expect(asked).toEqual([
      '/data/tintal/manifest.json',
      ...KINDS.map((k) => `/data/tintal/${k}.bin.gz?v=abc${k}`),
    ]);
    expect([data.edificios.count, data.vias.count, data.suelo.count, data.puntos.arboles.osm.length]).toEqual([3, 3, 2, 2]);
  });

  it('acepta archivos que el servidor ya entregó descomprimidos (Content-Encoding: gzip)', async () => {
    const { fetcher } = fakeFetch((k) => new Uint8Array(gunzipSync(files[k as FixtureFile])));
    const data = await loadTintal3D('https://tintal.test/data/tintal/', fetcher);
    expect(data.vias.textos.nombres).toContain('Carrera 90');
  });

  it('falla claro si un archivo no corresponde al manifiesto (caché vieja o archivo cortado)', async () => {
    const { fetcher } = fakeFetch((k) => files[k as FixtureFile], manifest({ suelo: 12 }));
    await expect(loadTintal3D('https://tintal.test/data/tintal/', fetcher)).rejects.toThrow(/suelo/);
  });

  it('lista los buffers transferibles sin repetir ninguno', async () => {
    const { fetcher } = fakeFetch((k) => files[k as FixtureFile]);
    const list = transferables(await loadTintal3D('https://tintal.test/data/tintal/', fetcher));
    expect(list.length).toBeGreaterThan(40);
    expect(new Set(list).size).toBe(list.length);
    expect(list.every((b) => b instanceof ArrayBuffer)).toBe(true);
  });
});

describe('gunzip', () => {
  it('descomprime gzip con DecompressionStream y deja pasar lo que no es gzip', async () => {
    const plain = new Uint8Array(gunzipSync(files.puntos));
    expect(new Uint8Array(await gunzip(files.puntos))).toEqual(plain);
    expect(new Uint8Array(await gunzip(plain))).toEqual(plain);
  });
});
