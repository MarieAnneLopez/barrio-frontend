// @vitest-environment node
// Los datos reales comitidos (public/data/tintal) se decodifican y cuadran con su manifiesto:
// huellas válidas, índices en sus tablas, coordenadas dentro del barrio y conteos iguales.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createProjection } from '../projection';
import { decodeEdificios, decodePuntos, decodeSuelo, decodeVias } from './decode';
import { TNT3, type TintalFile, type TintalManifest } from './format';
import { gunzip } from './gunzip';

const dir = new URL('../../../public/data/tintal/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8')) as TintalManifest;
const raw = (file: TintalFile) => new Uint8Array(readFileSync(new URL(manifest.archivos[file].ruta, dir)));
const plain = async (file: TintalFile) => gunzip(raw(file));
const ring = (xz: Float32Array, from: number, to: number) => {
  let sum = 0;
  for (let i = from, j = to - 1; i < to; j = i++) sum += (xz[2 * j] ?? 0) * -(xz[2 * i + 1] ?? 0) - (xz[2 * i] ?? 0) * -(xz[2 * j + 1] ?? 0);
  return sum / 2;
};

describe('public/data/tintal', () => {
  it('cada archivo es el que dice el manifiesto (tamaño y sha256) y todo pesa menos de 6 MB', () => {
    let total = 0;
    for (const file of ['edificios', 'vias', 'suelo', 'puntos'] as const) {
      const bytes = raw(file);
      total += bytes.length;
      expect(bytes.length).toBe(manifest.archivos[file].bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.archivos[file].sha256);
    }
    expect(total).toBeLessThan(6 * 1024 * 1024);
  });

  it('usa la proyección de la escena: el origen es el centro del bbox del polígono', () => {
    const [w, s, e, n] = manifest.proyeccion.bbox;
    expect(manifest.proyeccion.origen).toEqual([(w + e) / 2, (s + n) / 2]);
    expect(createProjection(manifest.proyeccion.bbox)(manifest.proyeccion.origen).map((v) => v + 0)).toEqual([0, 0]);
    expect(manifest.proyeccion.unidadesPorMetro).toBe(TNT3.unidadesPorMetro);
  });

  it('edificios: conteos del manifiesto, exteriores antihorarios y huecos horarios', async () => {
    const e = decodeEdificios(await plain('edificios'));
    const c = manifest.conteos.edificios ?? {};
    expect(e.count).toBe(c.total);
    expect(e.osm.filter((id) => id !== 0).length).toBe(c.osm);
    expect(e.tipoDireccion.filter((t) => t === 1 || t === 2).length).toBe(c.placaOficial);
    expect(e.tipoNombre.filter((t) => t > 0).length).toBe(c.conNombre);
    const bad: number[] = [];
    for (let b = 0; b < e.count; b++) {
      for (let r = e.edificios[b] ?? 0; r < (e.edificios[b + 1] ?? 0); r++) {
        const [from, to] = [e.anillos[r] ?? 0, e.anillos[r + 1] ?? 0];
        const orientation = Math.sign(ring(e.xz, from, to));
        if (to - from < 3 || orientation !== (r === e.edificios[b] ? 1 : -1)) bad.push(b);
      }
    }
    expect(bad).toEqual([]);
  });

  it('vías, suelo y puntos: conteos del manifiesto y coordenadas dentro del bbox del barrio', async () => {
    const [v, s, p] = [decodeVias(await plain('vias')), decodeSuelo(await plain('suelo')), decodePuntos(await plain('puntos'))];
    const cv = manifest.conteos.vias ?? {};
    const cs = manifest.conteos.suelo ?? {};
    expect([v.count, v.nodos.length / 2, v.cruces.tipo.length, v.semaforos.osm.length]).toEqual([cv.tramos, cv.nodos, cv.cruces, cv.semaforos]);
    expect([s.count, s.lineas.count, p.arboles.osm.length, p.hileras.osm.length, p.faroles.osm.length]).toEqual([
      cs.areas, cs.lineasDeAgua, cs.arboles, cs.hilerasDeArboles, cs.faroles,
    ]);
    expect([s.clase[0], s.textos.nombres[s.nombre[0] ?? 0]]).toEqual([TNT3.clasesSuelo.barrio, manifest.barrio.nombre]);
    const project = createProjection(manifest.proyeccion.bbox);
    const [west, south, east, north] = manifest.proyeccion.bbox;
    const [x0, z1] = project([west, south]);
    const [x1, z0] = project([east, north]);
    let outside = 0;
    for (const xz of [v.nodos, s.xz, s.lineas.xz, p.arboles.xz, p.hileras.xz, v.cruces.xz]) {
      for (let i = 0; i < xz.length; i += 2) {
        const [x, z] = [xz[i] ?? 0, xz[i + 1] ?? 0];
        if (x < x0 - 1 || x > x1 + 1 || z < z0 - 1 || z > z1 + 1) outside += 1;
      }
    }
    expect(outside).toBe(0);
  });
});
