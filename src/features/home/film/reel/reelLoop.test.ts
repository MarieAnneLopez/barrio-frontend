import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLoop, type Loop } from './reelLoop';
import { fakeFrames, restoreHidden, setHidden } from './testKit';

const seen: number[] = [];
let frames: ReturnType<typeof fakeFrames>;
let loop: Loop;
let keepGoing = true;
/** Lo que pasa dentro de cada cuadro, además de apuntar su dt. */
let inside: () => void = () => undefined;

beforeEach(() => {
  seen.length = 0;
  keepGoing = true;
  inside = () => undefined;
  frames = fakeFrames();
  loop = createLoop((dt) => {
    seen.push(dt);
    inside();
    return keepGoing;
  });
});
afterEach(() => {
  loop.dispose();
  restoreHidden();
});

describe('bucle único del reel', () => {
  it('no pide cuadros hasta que el capítulo se ve; después, un solo rAF por mucho que se le despierte', () => {
    expect(frames.pending.size).toBe(0);
    loop.setVisible(true);
    for (let call = 0; call < 5; call += 1) loop.wake();
    expect(frames.pending.size).toBe(1);
    frames.flush(1000);
    expect(frames.pending.size).toBe(1);
    expect(seen).toHaveLength(1);
  });

  it('dt va en segundos, limitado a 0,05, y no acumula el tiempo fuera de pantalla', () => {
    loop.setVisible(true);
    [1000, 1016, 9000].forEach(frames.flush);
    expect(seen[0]).toBe(0);
    expect(seen[1]).toBeCloseTo(0.016, 12);
    expect(seen[2]).toBe(0.05);
    loop.setVisible(false);
    expect(frames.pending.size).toBe(0); // fuera de pantalla no queda ningún cuadro pedido
    loop.setVisible(true);
    frames.flush(60000);
    expect(seen[3]).toBe(0);
  });

  it('se pausa con el documento oculto y vuelve, sin salto, al mostrarse', () => {
    loop.setVisible(true);
    frames.flush(1000);
    setHidden(true);
    expect(frames.pending.size).toBe(0);
    setHidden(false);
    expect(frames.pending.size).toBe(1);
    frames.flush(80000);
    expect(seen).toEqual([0, 0]);
  });

  it('si no queda nada por animar se detiene, hasta que una entrada lo despierta', () => {
    keepGoing = false;
    loop.setVisible(true);
    frames.flush(1000);
    expect(frames.pending.size).toBe(0);
    loop.wake();
    expect(frames.pending.size).toBe(1);
    frames.flush(5000);
    expect(seen).toEqual([0, 0]);
  });

  it('despertarlo desde dentro de un cuadro ni pide un segundo rAF ni reinicia el reloj', () => {
    inside = () => loop.wake();
    keepGoing = false;
    loop.setVisible(true);
    [1000, 1016].forEach(frames.flush);
    expect(frames.pending.size).toBe(1);
    expect(seen[1]).toBeCloseTo(0.016, 12);
  });

  it('un cuadro que falla no deja el bucle sordo: el siguiente wake() vuelve a pedir cuadro', () => {
    inside = () => { throw new Error('cuadro roto'); };
    loop.setVisible(true);
    expect(() => frames.flush(1000)).toThrow('cuadro roto');
    loop.wake();
    expect(frames.pending.size).toBe(1);
  });

  it('dispose cancela el cuadro pendiente y deja de escuchar al documento', () => {
    loop.setVisible(true);
    loop.dispose();
    expect(frames.pending.size).toBe(0);
    setHidden(false);
    loop.wake();
    loop.setVisible(true);
    expect(frames.pending.size).toBe(0);
  });
});
