// @vitest-environment node
// Polígono desde un archivo local (TINTAL_POLIGONO): su fecha de consulta es la del archivo, así el
// manifiesto sale idéntico al repetir el build.
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readLocalPolygon } from './sources.mjs';

const dir = mkdtempSync(join(tmpdir(), 'datos3d-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const square = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] };

describe('readLocalPolygon', () => {
  it('lee el GeoJSON y toma como fecha la de modificación del archivo', () => {
    const file = join(dir, 'poligono.geojson');
    writeFileSync(file, JSON.stringify({ type: 'Feature', bbox: [0, 0, 1, 1], geometry: square }));
    const when = new Date('2026-11-14T06:53:36Z');
    utimesSync(file, when, when);
    expect(readLocalPolygon(file)).toEqual({
      feature: { type: 'Feature', bbox: [0, 0, 1, 1], geometry: square }, fecha: '2026-11-14T06:53:36.000Z',
    });
  });

  it('rechaza un archivo sin geometría o sin bbox', () => {
    const file = join(dir, 'sin-bbox.geojson');
    writeFileSync(file, JSON.stringify({ type: 'Feature', geometry: square }));
    expect(() => readLocalPolygon(file)).toThrow(/bbox/);
  });
});
