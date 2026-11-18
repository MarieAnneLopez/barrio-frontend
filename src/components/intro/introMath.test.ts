import { describe, expect, it } from 'vitest';
import { playDuration, revealClip } from '../../features/home/film/manifesto/manifestoMath';
import { cornerClip, fitSize, splitLines, staggerOrder } from './introMath';

describe('recorte del revelado desde cada esquina', () => {
  it('desde abajo a la derecha es exactamente la elipse del manifiesto del Inicio', () => {
    for (const b of [0, 0.25, 0.5, 1]) expect(cornerClip('br')(b)).toBe(revealClip(b));
  });

  it('las otras esquinas usan los mismos radios con otro centro', () => {
    expect(cornerClip('tl')(0.5)).toBe('ellipse(85% 75% at 0% 0%)');
    expect(cornerClip('tr')(0)).toBe('ellipse(20% 0% at 100% 0%)');
    expect(cornerClip('bl')(1)).toBe('ellipse(150% 150% at 0% 100%)');
  });
});

describe('orden de las palabras (índice de arranque de cada una)', () => {
  it('adelante, atrás y del centro hacia afuera', () => {
    expect(staggerOrder('forward', 4)).toEqual([0, 1, 2, 3]);
    expect(staggerOrder('backward', 4)).toEqual([3, 2, 1, 0]);
    expect(staggerOrder('center', 5)).toEqual([3, 1, 0, 2, 4]);
    expect(staggerOrder('center', 4)).toEqual([2, 0, 1, 3]);
    expect(staggerOrder('center', 1)).toEqual([0]);
  });

  it('cada palabra tiene un índice distinto de 0 a n − 1: el total dura lo mismo que adelante', () => {
    for (const order of ['forward', 'backward', 'center'] as const) {
      expect([...staggerOrder(order, 7)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }
  });

  it('con dos palabras el centro queda entre ellas y salen a la vez: no es adelante ni atrás, y dura lo mismo', () => {
    expect(staggerOrder('center', 2)).toEqual([0, 0]);
    // playManifesto dura playDuration(último turno + 1): con 1 a 3 palabras manda el revelado (1,1 s).
    expect(playDuration(1)).toBe(playDuration(2));
  });
});

describe('reparto en líneas', () => {
  it('hasta 3 palabras, una por línea', () => {
    expect(splitLines(['Mapa', '3D'])).toEqual([['Mapa'], ['3D']]);
    expect(splitLines(['Ayuda'])).toEqual([['Ayuda']]);
    expect(splitLines(['Estado', 'de', 'Calles'])).toEqual([['Estado'], ['de'], ['Calles']]);
  });

  it('con más, 3 líneas equilibradas por letras, en orden', () => {
    expect(splitLines(['Perfil', 'de', 'la', 'Creadora'])).toEqual([['Perfil'], ['de', 'la'], ['Creadora']]);
    expect(splitLines(['Créditos', 'de', 'las', 'fotos', 'del', 'barrio']).flat()).toEqual(
      ['Créditos', 'de', 'las', 'fotos', 'del', 'barrio'],
    );
  });
});

describe('cuerpo del titular (% del ancho)', () => {
  it('nunca pasa del 16,2 % del manifiesto', () => {
    expect(fitSize([['3D']], [0])).toBe(16.2);
  });

  it('baja para que la línea más larga, con su sangría, quepa en el ancho', () => {
    const size = fitSize([['Escenarios'], ['deportivos']], [0, 26]);
    // 10 letras a ~0,56em + la sangría del 26 %: 16,2 no cabe.
    expect(size).toBeLessThan(16.2);
    expect(size * (0.56 * 10 + 0.1) + 26).toBeLessThanOrEqual(86.01);
  });
});
