import { afterEach, describe, expect, it, vi } from 'vitest';
import { playManifesto } from './playManifesto';
import { buildStage, fakeFrames, fakeViewport } from './testDoubles';

const START = 'translate(40%, -10%) scale(0.85, 0.1) rotate(8deg)';
const BOUNCE = 'translate(-4.3301%, 1.0825%) scale(1.0162, 1.0974) rotate(-0.866deg)'; // raw = 0,3
const REST = 'translate(0%, 0%) scale(1) rotate(0deg)'; // el DOM abrevia scale(1, 1)

const stops: (() => void)[] = [];

function play() {
  const frames = fakeFrames();
  const view = fakeViewport();
  const stage = buildStage();
  const handlers = { onCover: vi.fn(), onEnd: vi.fn() };
  stops.push(playManifesto(stage.section, handlers));
  return { frames, view, ...stage, handlers };
}

afterEach(() => {
  stops.splice(0).forEach((stop) => stop()); // ninguna reproducción queda escuchando para la prueba siguiente
  document.body.replaceChildren();
});

describe('reproducción del manifiesto (un solo rAF que escribe estilos)', () => {
  it('no arranca hasta que la sección entra en vista; el primer cuadro dibuja t = 0 en las dos capas', () => {
    const { frames, view, words, paper } = play();
    expect(frames.request).not.toHaveBeenCalled();

    view.show(true);
    expect(frames.pending()).toBe(1);
    frames.run(5000);

    expect(words.map((word) => word.style.transform)).toEqual(Array(10).fill(START));
    expect(words.map((word) => word.style.opacity)).toEqual(Array(10).fill('0'));
    expect(paper.style.clipPath).toBe('ellipse(20% 0% at 100% 100%)');
    expect(frames.pending()).toBe(1); // sigue: un cuadro pendiente, nunca dos
  });

  it('cada palabra sale con su retraso, igual en las dos capas, y se pasa de su sitio en el rebote', () => {
    const { frames, view, words } = play();
    view.show(true);
    frames.run(1000);
    frames.advance(1000, 262.5); // t = 0,2625 s: la primera va por raw = 0,3

    expect([words[0]?.style.transform, words[5]?.style.transform]).toEqual([BOUNCE, BOUNCE]);
    expect([words[4]?.style.transform, words[9]?.style.transform]).toEqual([START, START]); // la quinta sale a los 0,352 s
    expect(words[0]?.style.opacity).toBe('1');
  });

  it('el papel se abre con la elipse: a los 0,55 s va por b = 0,875', () => {
    const { frames, view, paper } = play();
    view.show(true);
    frames.run(1000);
    frames.advance(1000, 550);
    expect(paper.style.clipPath).toBe('ellipse(133.75% 131.25% at 100% 100%)');
  });

  it('un cuadro que llega tarde avanza como mucho 50 ms: no se come la animación', () => {
    const { frames, view, words } = play();
    view.show(true);
    frames.run(1000);
    frames.run(1400);
    expect(words[0]?.style.opacity).toBe('0.2857'); // 5 · (0,05 / 0,875)
  });

  it('avisa cuando el papel ya cubre toda la sección (≈ 0,67 s), antes de terminar', () => {
    const { frames, view, handlers } = play();
    view.show(true);
    frames.run(1000);
    frames.advance(1000, 600);
    expect(handlers.onCover).not.toHaveBeenCalled();
    frames.advance(1600, 100);
    expect(handlers.onCover).toHaveBeenCalledTimes(1);
    expect(handlers.onEnd).not.toHaveBeenCalled();
  });

  it('al terminar (1,227 s) deja el estado final, avisa una sola vez y no vuelve a pedir cuadros', () => {
    const { frames, view, words, paper, handlers } = play();
    view.show(true);
    frames.run(1000);
    frames.advance(1000, 1200);
    expect(handlers.onEnd).not.toHaveBeenCalled();
    frames.advance(2200, 50);

    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(handlers.onCover).toHaveBeenCalledTimes(1);
    expect(words.map((word) => word.style.transform)).toEqual(Array(10).fill(REST));
    expect(words.map((word) => word.style.opacity)).toEqual(Array(10).fill('1'));
    expect(paper.style.clipPath).toBe('ellipse(150% 150% at 100% 100%)');
    expect(frames.pending()).toBe(0);

    view.show(false);
    view.show(true); // se dispara una vez: volver a entrar en vista no la repite
    expect(frames.pending()).toBe(0);
    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
  });
});
