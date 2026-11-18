import { describe, expect, it } from 'vitest';
import { EDIFICIOS } from '../../test/buildingWorld';
import { buildingInfo, osmUrl } from './buildingInfo';

describe('ficha de un edificio con los datos reales (FORMATO.md §3)', () => {
  it('con nombre de OSM, placa en su huella (DIRT 1), pisos de Catastro, lote y sector', () => {
    expect(buildingInfo(EDIFICIOS, 0)).toEqual({
      name: 'Conjunto Torres del Parque', nameRef: 'way/123', address: 'KR 88D # 6D-27 TO 6', addressKind: 1,
      floors: 6, base: 0, basements: 1, lot: '004627077011', sector: 'CALANDAIMA', osm: 0,
      underConstruction: false, center: [5, 5],
    });
  });

  it('sin nombre: la dirección de su lote (DIRT 2) o la aproximada de la manzana (DIRT 3)', () => {
    expect(buildingInfo(EDIFICIOS, 1)).toMatchObject({ name: null, address: 'KR 88D # 6D-27', addressKind: 2, floors: 3 });
    expect(buildingInfo(EDIFICIOS, 2)).toMatchObject({ address: 'CL 6 # 88-10', addressKind: 3, base: 2 });
  });

  it('sin la bandera pisosConocidos los pisos son «sin dato» (null), nunca un número', () => {
    expect(buildingInfo(EDIFICIOS, 2)?.floors).toBeNull();
    expect(buildingInfo(EDIFICIOS, 3)?.floors).toBeNull();
  });

  it('sin placa (DIRT 0) no hay dirección; un edificio de OSM guarda su id', () => {
    expect(buildingInfo(EDIFICIOS, 3)).toMatchObject({ address: null, addressKind: 0, lot: null, osm: 456, center: [105, 105] });
  });

  it('un índice fuera de los datos no tiene ficha', () => {
    for (const index of [-1, 4, 1.5, Number.NaN]) expect(buildingInfo(EDIFICIOS, index)).toBeNull();
  });

  it('enlace a OSM: vía (way) si el id es positivo, relación si es negativo', () => {
    expect(osmUrl(456)).toBe('https://www.openstreetmap.org/way/456');
    expect(osmUrl(-789)).toBe('https://www.openstreetmap.org/relation/789');
    expect(osmUrl('way/123')).toBe('https://www.openstreetmap.org/way/123');
  });
});
