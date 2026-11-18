// @vitest-environment node
// Texto de la placa oficial (Catastro, capa Placa Domiciliaria). Qué placa toma cada edificio se
// prueba en direcciones.test.mjs.
import { describe, expect, it } from 'vitest';
import { formatPlaca, placaBase } from './placas.mjs';

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

  it('un PDOCINTERI sin forma de cruce y distancia no es el número del conjunto', () => {
    expect(formatPlaca({ PDONVIAL: 'CL 34A S', PDOTEXTO: 'IN 8', PDOCINTERI: '8' })).toBe('CL 34A S IN 8');
    expect(formatPlaca({ PDONVIAL: 'KR 95A', PDOTEXTO: 'MJ 34', PDOCINTERI: 'MJ 34' })).toBe('KR 95A MJ 34');
  });

  it('sin vía ni número, un interior solo no es una dirección', () => {
    expect(formatPlaca({ PDONVIAL: null, PDOTEXTO: 'IN 1', PDOCINTERI: 'IN 1' })).toBe('');
  });
});

describe('placaBase', () => {
  it('la dirección del conjunto: la placa sin casa, torre ni interior', () => {
    expect(placaBase({ PDONVIAL: 'KR 88D', PDOTEXTO: 'TO 6', PDOCINTERI: '6D 27' })).toBe('KR 88D # 6D-27');
    expect(placaBase({ PDONVIAL: 'CL 2', PDOTEXTO: 'TO 3', PDOCINTERI: null })).toBe('CL 2');
    expect(placaBase({ PDONVIAL: 'KR 87B', PDOTEXTO: '6D 20', PDOCINTERI: null })).toBe('KR 87B # 6D-20');
  });
});
