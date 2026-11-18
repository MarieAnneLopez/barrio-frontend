import { describe, expect, it } from 'vitest';
import { columnsFor, hash01, hashU32, LIT_FRACTION, WINDOW_GLSL, windowLit } from './windows';

describe('columnas de ventanas', () => {
  it('una columna cada ~3 m; los tramos de menos de 2,25 m no llevan ventanas', () => {
    expect([0.5, 2.2, 2.3, 3, 4.4, 4.6, 9, 30].map((l) => columnsFor(l))).toEqual([0, 0, 1, 1, 1, 2, 3, 10]);
  });
});

describe('hash de las ventanas (el shader usa el mismo, con uint de 32 bits)', () => {
  it('es determinista: mismas entradas, mismo valor (valores de referencia fijos)', () => {
    expect([hashU32(1, 2, 3), hashU32(20393, 22, 700)]).toEqual([hashU32(1, 2, 3), hashU32(20393, 22, 700)]);
    // Valores fijos: si alguien cambia el hash aquí, debe cambiarlo también en el GLSL.
    expect([hashU32(1, 2, 3), hashU32(20393, 22, 700)]).toEqual([2912732679, 4056738930]);
    expect(hashU32(0, 0, 0)).toBe(3348245848); // con semilla: el origen no da 0
  });

  it('cambia con el edificio, el piso y la columna, y reparte parejo en [0, 1)', () => {
    expect(new Set([hash01(5, 1, 1), hash01(6, 1, 1), hash01(5, 2, 1), hash01(5, 1, 2)]).size).toBe(4);
    let sum = 0;
    const N = 20_000;
    for (let i = 0; i < N; i++) {
      const v = hash01(i % 997, Math.floor(i / 997), i % 13);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / N).toBeCloseTo(0.5, 1);
  });

  it('de noche se enciende cerca de LIT_FRACTION de las ventanas; de día ninguna', () => {
    const count = (t: number, night: number) => {
      let on = 0;
      for (let b = 0; b < 200; b++) for (let f = 0; f < 5; f++) for (let c = 0; c < 10; c++) on += windowLit(b, f, c, t, night) ? 1 : 0;
      return on / 10_000;
    };
    expect(count(100, 1)).toBeCloseTo(LIT_FRACTION, 1);
    expect(count(100, 0)).toBe(0);
    expect(count(100, 0.5)).toBeLessThan(count(100, 1));
  });

  it('las ventanas cambian despacio: en un segundo cambia menos del 2 %', () => {
    let changed = 0;
    for (let b = 0; b < 400; b++) for (let c = 0; c < 25; c++) changed += windowLit(b, 3, c, 500, 1) !== windowLit(b, 3, c, 501, 1) ? 1 : 0;
    expect(changed / 10_000).toBeLessThan(0.02);
  });

  it('cuando el reloj del cielo vuelve de 3600 s a 0 (SkyDriver, cada hora) no cambian todas a la vez', () => {
    let changed = 0;
    for (let b = 0; b < 400; b++) for (let c = 0; c < 25; c++) changed += windowLit(b, 3, c, 3599.5, 1) !== windowLit(b, 3, c, 0.5, 1) ? 1 : 0;
    expect(changed / 10_000).toBeLessThan(0.02);
  });

  it('el GLSL usa las mismas constantes que la versión en TypeScript', () => {
    expect(WINDOW_GLSL).toContain('0x9E3779B1u');
    expect(WINDOW_GLSL).toContain('0x846CA68Bu');
    expect(WINDOW_GLSL).toContain(`${LIT_FRACTION}`);
    expect(WINDOW_GLSL).toContain('float slots = 15.0 + floor(r0 * 26.0);');
    expect(WINDOW_GLSL).toContain('floor(uTime * slots / 3600.0 + r0)');
  });
});
