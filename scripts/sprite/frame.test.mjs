// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { isSpill } from './frame.mjs';

describe('isSpill', () => {
  it('detecta halos visibles de mezcla con el fondo', () => {
    expect(isSpill([252, 140, 202])).toBe(true); // amarillo + magenta
    expect(isSpill([254, 41, 255])).toBe(true); // fondo puro
  });

  it('respeta el contorno oscuro y los colores del personaje', () => {
    expect(isSpill([57, 0, 68])).toBe(false); // contorno morado casi negro
    expect(isSpill([41, 28, 58])).toBe(false);
    expect(isSpill([180, 170, 230])).toBe(false); // pulsera lila
    expect(isSpill([240, 150, 160])).toBe(false); // rubor
    expect(isSpill([250, 240, 150])).toBe(false); // vestido
  });
});
