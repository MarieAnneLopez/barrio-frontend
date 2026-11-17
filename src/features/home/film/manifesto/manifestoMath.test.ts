import { describe, expect, it } from 'vitest';
import { elastic, playDuration, revealClip, revealCovers, revealProgress, wordFrame, wordRaw } from './manifestoMath';

// Valores sacados a mano de la especificación (docs/superpowers/specs, §6, cap. 1). La elástica tiene
// periodo 0,72: (raw − 0,18) · 500° es el ángulo del seno, así que 0,1 → −40°, 0,3 → 60°, 0,5 → 160°.
describe('elástica de salida E(raw)', () => {
  it('vale 0 en 0 y 1 en 1, también fuera del intervalo', () => {
    expect(elastic(0)).toBe(0);
    expect(elastic(1)).toBe(1);
    expect(elastic(-0.4)).toBe(0);
    expect(elastic(1.7)).toBe(1);
  });

  it.each([
    [0.1, 0.678606], // 1 + 2^-1 · sin(−40°)
    [0.18, 1], // primer cruce por 1
    [0.3, 1.108253], // 1 + 2^-3 · sin(60°)
    [0.36, 1.082469], // 1 + 2^-3,6 · sin(90°)
    [0.5, 1.010688], // 1 + 2^-5 · sin(160°)
    [0.72, 0.993199], // 1 + 2^-7,2 · sin(270°): rebota también por debajo
  ])('E(%f) = %f', (raw, want) => {
    expect(elastic(raw)).toBeCloseTo(want, 5);
  });

  it('el rebote pasa de 1 y no se limita', () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, k) => elastic(k / 100)));
    expect(peak).toBeGreaterThan(1.1);
    expect(peak).toBeLessThan(1.12);
  });
});

describe('palabra i en el segundo t', () => {
  it('cada palabra arranca 0,088 s después de la anterior y dura 0,875 s', () => {
    expect(wordRaw(0, 0)).toBe(0);
    expect(wordRaw(0.4375, 0)).toBeCloseTo(0.5, 10);
    expect(wordRaw(0.352, 4)).toBe(0);
    expect(wordRaw(0.7895, 4)).toBeCloseTo(0.5, 10);
    expect(wordRaw(1.227, 4)).toBe(1);
    expect(wordRaw(9, 2)).toBe(1);
  });

  it('empieza desplazada, aplastada y girada, e invisible', () => {
    expect(wordFrame(0, 0)).toEqual({ transform: 'translate(40%, -10%) scale(0.85, 0.1) rotate(8deg)', opacity: '0' });
    expect(wordFrame(0.3, 4)).toEqual(wordFrame(0, 0)); // la quinta aún no arranca
  });

  it('termina en su sitio y opaca', () => {
    expect(wordFrame(0.875, 0)).toEqual({ transform: 'translate(0%, 0%) scale(1, 1) rotate(0deg)', opacity: '1' });
  });

  it('en el rebote (raw = 0,3; p = 1,1083) se pasa de su sitio: retrocede, se estira y gira al revés', () => {
    const want = 'translate(-4.3301%, 1.0825%) scale(1.0162, 1.0974) rotate(-0.866deg)';
    expect(wordFrame(0.2625, 0).transform).toBe(want);
    expect(wordFrame(0.176 + 0.2625, 2).transform).toBe(want);
  });

  it('la opacidad llega a 1 en la quinta parte del recorrido', () => {
    expect(wordFrame(0.0875, 0).opacity).toBe('0.5'); // raw = 0,1
    expect(wordFrame(0.175, 0).opacity).toBe('1'); // raw = 0,2
    expect(wordFrame(0.5, 0).opacity).toBe('1');
  });
});

describe('revelación del papel', () => {
  it('b sale rápido y frena (cúbica) en 1,1 s', () => {
    expect(revealProgress(0)).toBe(0);
    expect(revealProgress(0.55)).toBeCloseTo(0.875, 10); // 1 − 0,5³
    expect(revealProgress(1.1)).toBe(1);
    expect(revealProgress(4)).toBe(1);
  });

  it('la elipse crece desde abajo a la derecha', () => {
    expect(revealClip(0)).toBe('ellipse(20% 0% at 100% 100%)');
    expect(revealClip(0.875)).toBe('ellipse(133.75% 131.25% at 100% 100%)');
    expect(revealClip(1)).toBe('ellipse(150% 150% at 100% 100%)');
  });

  it('cubre toda la capa (la esquina de arriba a la izquierda es la última) algo antes de terminar', () => {
    expect(revealCovers(0)).toBe(false);
    expect(revealCovers(0.93)).toBe(false); // (1/1,409)² + (1/1,395)² = 1,018
    expect(revealCovers(0.95)).toBe(true); // (1/1,435)² + (1/1,425)² = 0,978
    expect(revealCovers(1)).toBe(true);
  });
});

describe('conjunto', () => {
  it('con 5 palabras todo termina a los 1,227 s, antes de 1,5 s; nunca antes que la revelación', () => {
    expect(playDuration(5)).toBeCloseTo(1.227, 10);
    expect(playDuration(5)).toBeLessThan(1.5);
    expect(playDuration(1)).toBe(1.1);
  });
});
