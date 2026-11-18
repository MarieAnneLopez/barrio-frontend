// @vitest-environment node
// Qué placa oficial toma cada edificio (Catastro, Placa Domiciliaria): la de su lote dentro de la
// huella o la más cercana, o la más cercana de su manzana. El número de casa, torre o interior solo
// va con el edificio al que identifica; si no, queda la dirección del conjunto.
import { describe, expect, it } from 'vitest';
import { assignPlacas } from './direcciones.mjs';

const box = (x, z, w = 10) => [[[x, z], [x + w, z], [x + w, z - 10], [x, z - 10]]];
const placa = (codigo, p, lote, { pdoTipo = 1, casa = '' } = {}) => ({
  codigo, p, lote, pdoTipo, base: `placa ${codigo}`, texto: casa ? `placa ${codigo} ${casa}` : `placa ${codigo}`,
});
const LOTE = '004601018028';
const one = (building, placas) => assignPlacas([building], placas)[0];

describe('assignPlacas: qué placa toma cada edificio', () => {
  const placas = [
    placa('dentro', [5, -5], LOTE, { pdoTipo: 2 }),
    placa('cerca', [12, -5], LOTE),
    placa('lejos', [40, -5], LOTE),
    placa('vecina', [-3, -5], '004601018029'),
    placa('otra-manzana', [0, 1], '004601019001'),
  ];

  it('la placa del lote que cae dentro de la huella gana aunque tenga un PDOTIPO mayor', () => {
    expect(one({ rings: box(0, 0), lote: LOTE }, placas)).toEqual({ tipo: 1, texto: 'placa dentro' });
  });

  it('si ninguna cae dentro, la más cercana del lote', () => {
    expect(one({ rings: box(20, 0), lote: LOTE }, placas)).toEqual({ tipo: 2, texto: 'placa cerca' });
  });

  it('a igual distancia gana el PDOTIPO menor (supuesto: 1 es la principal)', () => {
    const twin = [placa('b', [12, -5], 'L', { pdoTipo: 2 }), placa('a', [-2, -5], 'L', { pdoTipo: 1 })];
    expect(one({ rings: box(0, 0), lote: 'L' }, twin).texto).toBe('placa a');
  });

  it('un lote sin placas toma la más cercana de su manzana; sin manzana, nada', () => {
    expect(one({ rings: box(-20, 0), lote: '004601018099' }, placas)).toEqual({ tipo: 3, texto: 'placa vecina' });
    expect(one({ rings: box(0, 0), lote: '009999999001' }, placas)).toEqual({ tipo: 0, texto: '' });
    expect(one({ rings: box(0, 0), lote: '' }, placas)).toEqual({ tipo: 0, texto: '' });
  });
});

describe('assignPlacas: el número de casa, torre o interior', () => {
  it('dos casas y una sola placa «CA 5»: la que la contiene la lleva; la vecina, la del conjunto', () => {
    const casas = [{ rings: box(0, 0), lote: 'L' }, { rings: box(10, 0), lote: 'L' }];
    expect(assignPlacas(casas, [placa('p', [5, -5], 'L', { casa: 'CA 5' })])).toEqual([
      { tipo: 1, texto: 'placa p CA 5' }, { tipo: 2, texto: 'placa p' },
    ]);
  });

  it('fuera de las huellas lo lleva el edificio más cercano a la placa, si está a menos de 5 m', () => {
    const casas = [{ rings: box(0, 0), lote: 'L' }, { rings: box(12, 0), lote: 'L' }];
    expect(assignPlacas(casas, [placa('p', [10.5, -5], 'L', { casa: 'CA 5' })])).toEqual([
      { tipo: 2, texto: 'placa p CA 5' }, { tipo: 2, texto: 'placa p' },
    ]);
    const lejos = [placa('p', [16, -5], 'L', { casa: 'CA 5' })];
    expect(one({ rings: box(0, 0), lote: 'L' }, lejos)).toEqual({ tipo: 2, texto: 'placa p' });
  });

  it('una huella con varias casas dentro lleva la dirección del conjunto', () => {
    const casas = [placa('p1', [5, -5], 'L', { casa: 'CA 1' }), placa('p2', [15, -5], 'L', { casa: 'CA 2' })];
    expect(one({ rings: box(0, 0, 20), lote: 'L' }, casas)).toEqual({ tipo: 1, texto: 'placa p1' });
  });

  it('de la manzana nunca va el interior: es de un edificio de otro lote', () => {
    const vecina = [placa('v', [-3, -5], '004601018029', { casa: 'TO 6' })];
    expect(one({ rings: box(0, 0), lote: '004601018099' }, vecina)).toEqual({ tipo: 3, texto: 'placa v' });
  });

  it('una placa de la calle (sin interior) queda tal cual aunque esté lejos', () => {
    expect(one({ rings: box(0, 0), lote: 'L' }, [placa('calle', [40, -5], 'L')])).toEqual({ tipo: 2, texto: 'placa calle' });
  });
});
