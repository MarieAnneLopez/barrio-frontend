import { describe, expect, it } from 'vitest';
import { cameraZ, cardFrame, cardRatio, cardSide, clamp, imageZ, progress, smooth } from './flightMath';

// Valores sacados a mano de la especificación (docs/superpowers/specs, §6, cap. 2), con N = 4 fotos.
describe('funciones base', () => {
  it('clamp limita a [0, 1]', () => {
    expect([clamp(-2), clamp(0), clamp(0.3), clamp(1), clamp(7)]).toEqual([0, 0, 0.3, 1, 1]);
  });

  it.each([
    [-3, 0], [0, 0], [0.2, 0.104], [0.25, 0.15625], [0.5, 0.5], [0.7, 0.784], [0.75, 0.84375], [1, 1], [9, 1],
  ])('smooth(%f) = %f', (t, want) => {
    expect(smooth(t)).toBeCloseTo(want, 10);
  });
});

describe('avance del recorrido', () => {
  it('p va de 0 a 1 mientras la sección sube lo que puede recorrer (D)', () => {
    expect(progress(0, 4000)).toBe(0);
    expect(progress(-1000, 4000)).toBe(0.25);
    expect(progress(-2000, 4000)).toBe(0.5);
    expect(progress(-4000, 4000)).toBe(1);
  });

  it('antes y después del recorrido se queda en 0 y en 1', () => {
    expect(progress(300, 4000)).toBe(0);
    expect(progress(-9000, 4000)).toBe(1);
  });

  it('sin recorrido (D ≤ 0) vale 0', () => {
    expect(progress(-100, 0)).toBe(0);
    expect(progress(-100, -5)).toBe(0);
  });
});

describe('cámara y tarjetas', () => {
  it('la cámara avanza 100 px por foto: 30, 230 y 430 con N = 4', () => {
    expect([cameraZ(0, 4), cameraZ(0.5, 4), cameraZ(1, 4)]).toEqual([30, 230, 430]);
    expect(cameraZ(1, 3)).toBe(330);
  });

  it('cada tarjeta queda 100 px detrás de la anterior', () => {
    expect([0, 1, 2, 3].map(imageZ)).toEqual([-100, -200, -300, -400]);
  });

  it('en p = 0 se ven la primera (entera) y la segunda (entrando); las demás, ocultas', () => {
    expect(cardFrame(0, 30)).toEqual({ z: -70, opacity: 1, hidden: false });
    expect(cardFrame(1, 30).opacity).toBeCloseTo(0.784, 10); // smooth((−170 + 240) / 100)
    expect(cardFrame(1, 30).hidden).toBe(false);
    expect(cardFrame(2, 30)).toEqual({ z: -270, opacity: 0, hidden: true });
    expect(cardFrame(3, 30)).toEqual({ z: -370, opacity: 0, hidden: true });
  });

  it('en p = 0,5 las dos primeras ya pasaron y se ven la tercera y la cuarta', () => {
    expect(cardFrame(0, 230)).toEqual({ z: 130, opacity: 0, hidden: true });
    expect(cardFrame(1, 230)).toEqual({ z: 30, opacity: 0, hidden: true });
    expect(cardFrame(2, 230)).toEqual({ z: -70, opacity: 1, hidden: false });
    expect(cardFrame(3, 230).opacity).toBeCloseTo(0.784, 10);
  });

  it('en p = 1 no queda ninguna: solo el fondo', () => {
    expect([0, 1, 2, 3].map((i) => cardFrame(i, 430).hidden)).toEqual([true, true, true, true]);
    expect(cardFrame(3, 430).z).toBe(30);
  });

  it('entra desde lejos entre z = −240 y z = −140', () => {
    expect(cardFrame(0, -140)).toEqual({ z: -240, opacity: 0, hidden: true });
    expect(cardFrame(0, -90)).toEqual({ z: -190, opacity: 0.5, hidden: false });
    expect(cardFrame(0, -40)).toEqual({ z: -140, opacity: 1, hidden: false });
  });

  it('al pasar junto a la cámara se desvanece entre z = 20 y z = 28', () => {
    expect(cardFrame(0, 120)).toEqual({ z: 20, opacity: 1, hidden: false });
    expect(cardFrame(0, 124)).toEqual({ z: 24, opacity: 0.5, hidden: false });
    expect(cardFrame(0, 126).opacity).toBeCloseTo(0.15625, 10); // 1 − smooth(0,75)
    expect(cardFrame(0, 128)).toEqual({ z: 28, opacity: 0, hidden: true });
  });

  it('se oculta si la opacidad no pasa de 0,001 o si llega a z = 29', () => {
    expect(cardFrame(0, 127.9).opacity).toBeGreaterThan(0); // 0,00046: casi nada
    expect(cardFrame(0, 127.9).hidden).toBe(true);
    expect(cardFrame(0, 127).hidden).toBe(false); // 0,043
    expect(cardFrame(0, 129).hidden).toBe(true);
  });
});

describe('reparto de las tarjetas', () => {
  it('las proporciones [1,15 · 0,82 · 1,45 · 0,82] se repiten en ciclo', () => {
    expect([0, 1, 2, 3, 4, 5].map(cardRatio)).toEqual([1.15, 0.82, 1.45, 0.82, 1.15, 0.82]);
  });

  it('las pares van a la izquierda y las impares a la derecha', () => {
    expect([0, 1, 2, 3].map(cardSide)).toEqual(['left', 'right', 'left', 'right']);
  });
});
