// @vitest-environment node
// Decodificación completa del fixture que arma el mismo codificador de los datos reales.
import { describe, expect, it } from 'vitest';
import { buildFixture } from '../../../scripts/datos3d/fixture.mjs';
import { decodeEdificios, decodePuntos, decodeSuelo, decodeVias } from './decode';
import { gunzip } from './gunzip';

const files = buildFixture();
const round = (values: ArrayLike<number>) => Array.from(values, (v) => Math.round(v * 10) / 10);

describe('edificios', async () => {
  const e = decodeEdificios(await gunzip(files.edificios));

  it('huellas: anillo exterior y hueco por edificio, en metros', () => {
    expect(e.count).toBe(3);
    expect([...e.edificios]).toEqual([0, 2, 3, 4]);
    expect([...e.anillos]).toEqual([0, 4, 8, 11, 15]);
    expect(round(e.xz.subarray(0, 8))).toEqual([0, 0, 10, 0, 10, -10, 0, -10]);
    expect(round(e.xz.subarray(16, 22))).toEqual([2000, 1000, 2010.4, 1000, 2005, 991.3]);
  });

  it('pisos, base del voladizo, sótanos y banderas tal como vienen de la fuente', () => {
    expect([...e.pisos, ...e.base, ...e.sotanos, ...e.banderas]).toEqual([3, 0, 2, 0, 0, 1, 1, 0, 0, 2, 1, 6]);
  });

  it('dirección, nombre con su origen, lote y sector por índice en sus tablas', () => {
    const t = e.textos;
    expect(Array.from(e.direccion, (i) => t.direcciones[i])).toEqual(['KR 88D # 6D-27 TO 6', '', 'KR 88D # 6D-27 TO 6']);
    expect([...e.tipoDireccion, ...e.tipoNombre]).toEqual([1, 0, 2, 2, 1, 0]);
    expect(Array.from(e.nombre, (i) => t.nombres[i])).toEqual(['Ciudad Tintal SM3 SL1', 'Biblioteca El Tintal', '']);
    expect(Array.from(e.nombre, (i) => t.origenNombres[i])).toEqual(['way/123', 'way/252078999', '']);
    expect(Array.from(e.lote, (i) => t.lotes[i])).toEqual(['004601018028', '', '004601018028']);
    expect(Array.from(e.sector, (i) => t.sectores[i])).toEqual(['CIUDAD TINTAL', '', 'CIUDAD TINTAL']);
    expect([...e.osm]).toEqual([0, 252078999, 0]);
  });
});

describe('vías', async () => {
  const v = decodeVias(await gunzip(files.vias));

  it('red con nodos compartidos: cada tramo es una lista de índices de nodo', () => {
    expect(v.count).toBe(3);
    expect(round(v.nodos)).toEqual([0, 0, 50, 0, 50, -50, -3000, 1200]);
    expect([...v.tramos]).toEqual([0, 2, 4, 6]);
    expect([...v.indices]).toEqual([0, 1, 1, 2, 2, 3]);
  });

  it('clase, sentido, carriles, velocidad, nivel, banderas, nombre y OSM por tramo', () => {
    expect([...v.clase, ...v.sentido, ...v.carriles, ...v.vmax, ...v.nivel, ...v.banderas]).toEqual([
      7, 21, 3, 1, 0, -1, 2, 0, 3, 30, 0, 0, 0, 0, 1, 0, 0, 130,
    ]);
    expect(Array.from(v.nombre, (i) => v.textos.nombres[i])).toEqual(['Carrera 90', '', 'Avenida Ciudad de Cali']);
    expect([...v.osm]).toEqual([28118664, 5, 7]);
  });

  it('cruces con tipo, eje de la vía en radianes y largo en metros; semáforos', () => {
    expect(round(v.cruces.xz)).toEqual([25, 0]);
    expect([...v.cruces.tipo, ...v.cruces.osm]).toEqual([5, 99]);
    expect(v.cruces.angulo[0]).toBeCloseTo(1.5708, 4);
    expect(v.cruces.largo[0]).toBeCloseTo(7.5, 4);
    expect([...round(v.semaforos.xz), ...v.semaforos.osm]).toEqual([50, 0, 77]);
  });
});

describe('suelo y puntos', async () => {
  const s = decodeSuelo(await gunzip(files.suelo));
  const p = decodePuntos(await gunzip(files.puntos));

  it('áreas con clase y nombre; líneas de agua aparte', () => {
    expect([s.count, ...s.clase]).toEqual([2, 1, 2]);
    expect(Array.from(s.nombre, (i) => s.textos.nombres[i])).toEqual(['El Tintal', 'Parque Metropolitano El Tintal']);
    expect([...s.osm]).toEqual([0, -14577696]);
    expect([s.lineas.count, ...s.lineas.clase, ...s.lineas.osm]).toEqual([1, 1, 555]);
    expect(s.textos.nombres[s.lineas.nombre[0] ?? 0]).toBe('Canal Castilla');
    expect(round(s.lineas.xz)).toEqual([0, 10, 100, 10]);
  });

  it('árboles e hileras reales; faroles vacíos si la fuente no tiene', () => {
    expect([...round(p.arboles.xz), ...p.arboles.osm]).toEqual([1, 1, 2.3, -2, 1, 2]);
    expect([...p.hileras.inicios, ...p.hileras.osm]).toEqual([0, 3, 3]);
    expect(p.faroles.xz.length + p.faroles.osm.length).toBe(0);
  });
});
