import { describe, expect, it } from 'vitest';
import { SKY_FRAGMENT } from './SkyDome';
import { STAR_CELLS, STAR_GLSL, STAR_THRESHOLD, starCellPx, STARS_PER_SQ_RADIAN } from './stars';

describe('estrellas de la cúpula con el teleobjetivo de 10°', () => {
  it('cada celda mide pocos píxeles a 900 y a 2160 px de alto (antes ~23 px: cuadrados blancos)', () => {
    expect(starCellPx(900, 10, 220)).toBeGreaterThan(20);
    expect(starCellPx(900)).toBeLessThan(4.5);
    expect(starCellPx(2160)).toBeLessThan(10);
  });

  it('el umbral da la densidad pedida por radián cuadrado', () => {
    expect((1 - STAR_THRESHOLD) * STAR_CELLS * STAR_CELLS).toBeCloseTo(STARS_PER_SQ_RADIAN, 6);
  });

  it('el shader usa las mismas celdas, el mismo umbral y un punto redondo, no la celda entera', () => {
    expect(STAR_GLSL).toContain(`dir * ${STAR_CELLS.toFixed(1)}`);
    expect(STAR_GLSL).toContain(STAR_THRESHOLD.toFixed(8));
    expect(STAR_GLSL).toMatch(/length\(fract\(cell\) - 0\.5\)/);
    expect(STAR_GLSL).not.toMatch(/sin\(/);
  });

  it('la cúpula pinta sus estrellas con starAt, no con las celdas grandes de antes', () => {
    expect(SKY_FRAGMENT).toContain(STAR_GLSL);
    expect(SKY_FRAGMENT).toMatch(/starAt\(dir\)/);
    expect(SKY_FRAGMENT).not.toContain('220.0');
  });
});
