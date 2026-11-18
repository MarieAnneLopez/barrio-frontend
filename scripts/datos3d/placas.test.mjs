// @vitest-environment node
// Direcciones: texto de la placa oficial (Catastro, capa Placa Domiciliaria) y elección de la
// placa de cada edificio: la de su lote (dentro de la huella o la más cercana) o la más cercana de
// su manzana.
import { describe, expect, it } from 'vitest';
import { choosePlaca, formatPlaca, indexPlacas } from './placas.mjs';

describe('formatPlaca', () => {
  it('placa de la calle: vía # cruce-distancia', () => {
    expect(formatPlaca({ PDONVIAL: 'KR 87B', PDOTEXTO: '6D 20', PDOCINTERI: null })).toBe('KR 87B # 6D-20');
    expect(formatPlaca({ PDONVIAL: 'CL 36 S', PDOTEXTO: '89C 24', PDOCINTERI: null })).toBe('CL 36 S # 89C-24');
    expect(formatPlaca({ PDONVIAL: 'KR 89D', PDOTEXTO: '34 17 S', PDOCINTERI: null })).toBe('KR 89D # 34-17 S');
  });

  it('placa interior: la dirección del conjunto y luego la torre, casa o interior', () => {
    expect(formatPlaca({ PDONVIAL: 'KR 88D', PDOTEXTO: 'TO 6', PDOCINTERI: '6D 27' })).toBe('KR 88D # 6D-27 TO 6');
    expect(formatPlaca({ PDONVIAL: 'CL 10B', PDOTEXTO: 'CA 12', PDOCINTERI: '89A 13' })).toBe('CL 10B # 89A-13 CA 12');
  });

  it('interior sin código del conjunto: solo la vía y la torre; número repetido: una vez', () => {
    expect(formatPlaca({ PDONVIAL: 'CL 2', PDOTEXTO: 'TO 3', PDOCINTERI: null })).toBe('CL 2 TO 3');
    expect(formatPlaca({ PDONVIAL: 'CL 32 S', PDOTEXTO: '89D 57', PDOCINTERI: '89D 57' })).toBe('CL 32 S # 89D-57');
    expect(formatPlaca({ PDONVIAL: 'KR 89C', PDOTEXTO: '37 17 S', PDOCINTERI: '37 15 S' })).toBe('KR 89C # 37-17 S');
  });

  it('limpia espacios de más y tolera textos vacíos', () => {
    expect(formatPlaca({ PDONVIAL: 'KR 95A', PDOTEXTO: null, PDOCINTERI: '34 76  S' })).toBe('KR 95A # 34-76 S');
    expect(formatPlaca({ PDONVIAL: 'CL 7', PDOTEXTO: '87B 40 ', PDOCINTERI: null })).toBe('CL 7 # 87B-40');
    expect(formatPlaca({ PDONVIAL: null, PDOTEXTO: '6D 20', PDOCINTERI: null })).toBe('6D-20');
  });
});

describe('choosePlaca', () => {
  const house = [[[0, 0], [10, 0], [10, -10], [0, -10]]];
  const placa = (codigo, p, lote, pdoTipo = 1) => ({ codigo, p, lote, pdoTipo, texto: `placa ${codigo}` });
  const index = indexPlacas([
    placa('dentro', [5, -5], '004601018028', 2),
    placa('cerca', [12, -5], '004601018028'),
    placa('lejos', [40, -5], '004601018028'),
    placa('vecina', [-3, -5], '004601018029'),
    placa('otra-manzana', [0, 1], '004601019001'),
  ]);

  it('la placa del lote que cae dentro de la huella gana aunque sea secundaria', () => {
    expect(choosePlaca(house, '004601018028', index)).toEqual({ tipo: 1, texto: 'placa dentro' });
  });

  it('si ninguna cae dentro, la más cercana del lote', () => {
    const shifted = [[[20, 0], [30, 0], [30, -10], [20, -10]]];
    expect(choosePlaca(shifted, '004601018028', index)).toEqual({ tipo: 2, texto: 'placa cerca' });
  });

  it('a igual distancia gana la principal', () => {
    const twin = indexPlacas([placa('b-secundaria', [12, -5], 'L', 2), placa('a-principal', [-2, -5], 'L', 1)]);
    expect(choosePlaca(house, 'L', twin).texto).toBe('placa a-principal');
  });

  it('un lote sin placas toma la más cercana de su manzana; sin manzana, nada', () => {
    const west = [[[-20, 0], [-10, 0], [-10, -10], [-20, -10]]];
    expect(choosePlaca(west, '004601018099', index)).toEqual({ tipo: 3, texto: 'placa vecina' });
    expect(choosePlaca(house, '009999999001', index)).toEqual({ tipo: 0, texto: '' });
    expect(choosePlaca(house, '', index)).toEqual({ tipo: 0, texto: '' });
  });
});
