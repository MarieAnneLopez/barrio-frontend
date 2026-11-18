// @vitest-environment node
// Encuadre con los datos reales comitidos (public/data/tintal): el borde del barrio, la malla vial y
// la zona con más edificios salen de los binarios TNT3, sin la API.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeEdificios, decodeSuelo, decodeVias } from './decode';
import type { TintalFile, TintalManifest } from './format';
import { gunzip } from './gunzip';
import { barrioOutline, BLOCK_SIZE_M, worldFraming } from './worldFraming';

const dir = new URL('../../../public/data/tintal/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8')) as TintalManifest;
const plain = (file: TintalFile) => gunzip(new Uint8Array(readFileSync(new URL(manifest.archivos[file].ruta, dir))));

describe('encuadre con los datos reales', async () => {
  const world = {
    suelo: decodeSuelo(await plain('suelo')),
    vias: decodeVias(await plain('vias')),
    edificios: decodeEdificios(await plain('edificios')),
  };
  const framing = worldFraming(world);

  it('el borde del barrio es un anillo cerrado de varios kilómetros', () => {
    const outline = barrioOutline(world);
    expect(outline.length / 2).toBeGreaterThan(20);
    expect(framing.size[0]).toBeGreaterThan(2000);
    expect(framing.size[1]).toBeGreaterThan(1500);
  });

  it('la zona con más edificios cae dentro de la caja del barrio', () => {
    const [x, z] = framing.spot;
    expect(Math.abs(x - framing.center[0])).toBeLessThan(framing.size[0] / 2);
    expect(Math.abs(z - framing.center[1])).toBeLessThan(framing.size[1] / 2);
  });

  it('la malla vial tiene un azimut dominante entre 0 y 90° y la manzana tipo es la de D83', () => {
    expect(framing.grid).toBeGreaterThanOrEqual(0);
    expect(framing.grid).toBeLessThan(90);
    expect(framing.blockSize).toBe(BLOCK_SIZE_M);
  });
});
