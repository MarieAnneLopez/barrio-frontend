// @vitest-environment node
// Comprobaciones del decodificador: un archivo cortado o mezclado falla con FormatError y un mensaje
// claro en vez de dibujar basura.
import { describe, expect, it } from 'vitest';
import { sameLength, startsCover, withinTable } from './checks';
import { FormatError } from './container';

describe('checks', () => {
  it('sameLength: una columna con otro número de filas', () => {
    const bad = () => sameLength('edificios', 3, { pisos: [1, 2, 3], base: [0, 0] });
    expect(bad).toThrow(FormatError);
    expect(bad).toThrow(/edificios: base tiene 2 filas; se esperaban 3/);
    expect(() => sameLength('edificios', 2, { pisos: [1, 2], base: [0, 0] })).not.toThrow();
  });

  it('startsCover: inicios vacíos, que no empiezan en 0, desordenados o que no llegan al total', () => {
    for (const begins of [[], [1, 4], [0, 3, 2, 4], [0, 3]]) {
      expect(() => startsCover('vías', begins, 4)).toThrow(FormatError);
      expect(() => startsCover('vías', begins, 4)).toThrow(/vías: los inicios no cubren los 4 elementos/);
    }
    expect(() => startsCover('vías', [0, 2, 2, 4], 4)).not.toThrow();
  });

  it('withinTable: un índice fuera de su tabla', () => {
    const bad = () => withinTable('nombres', Uint32Array.of(0, 2, 5), 3);
    expect(bad).toThrow(FormatError);
    expect(bad).toThrow(/nombres: índice 5 fuera de la tabla \(3\)/);
    expect(() => withinTable('nombres', Uint32Array.of(0, 2), 3)).not.toThrow();
  });
});
