// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  colorDistance,
  estimateBackground,
  isMagentaFamily,
  isShadowColor,
  rgbToHsv,
} from './color.mjs';

describe('color', () => {
  it('mide distancia euclídea RGB', () => {
    expect(colorDistance([0, 0, 0], [3, 4, 0])).toBe(5);
  });

  it('convierte a HSV con matiz en grados', () => {
    const [h, s, v] = rgbToHsv([255, 0, 255]);
    expect(h).toBeCloseTo(300);
    expect(s).toBeCloseTo(1);
    expect(v).toBeCloseTo(1);
  });

  it('reconoce fondo, sombra y última fila como familia magenta', () => {
    expect(isMagentaFamily([254, 41, 255])).toBe(true);
    expect(isMagentaFamily([147, 14, 152])).toBe(true);
    expect(isMagentaFamily([209, 78, 206])).toBe(true);
  });

  it('no confunde colores del personaje con magenta', () => {
    const personaje = [
      [41, 28, 58], // contorno morado oscuro
      [250, 240, 150], // vestido amarillo
      [230, 170, 140], // piel
      [240, 150, 160], // rubor
      [200, 30, 40], // pulsera roja
      [180, 170, 230], // pulsera lila
      [90, 50, 30], // cabello
    ];
    for (const rgb of personaje) expect(isMagentaFamily(rgb)).toBe(false);
  });

  it('reconoce la sombra oscura por matiz, sin tocar botas ni contorno', () => {
    expect(isShadowColor([100, 5, 110])).toBe(true);
    expect(isShadowColor([147, 14, 152])).toBe(true);
    expect(isShadowColor([40, 40, 55])).toBe(false);
    expect(isShadowColor([41, 28, 58])).toBe(false);
  });

  it('estima el fondo con la mediana de las filas superiores', () => {
    const W = 4;
    const H = 3;
    const data = new Uint8Array(W * H * 3);
    for (let i = 0; i < W * H; i++) data.set([254, 41, 255], i * 3);
    data.set([0, 0, 0], 0);
    expect(estimateBackground(data, W, H, 2)).toEqual([254, 41, 255]);
  });
});
