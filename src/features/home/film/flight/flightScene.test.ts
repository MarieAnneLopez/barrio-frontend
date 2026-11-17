import { afterEach, describe, expect, it } from 'vitest';
import { runFlight } from './flightScene';
import { buildFlight, fakeFrames, flightRig } from './testDoubles';

const stops: (() => void)[] = [];

/** Vuelo en marcha y a la vista: 4 tarjetas, sección de 5000 px y pantalla de 1000 px (D = 4000). */
function fly() {
  const rig = flightRig();
  stops.push(runFlight(rig.outer));
  rig.view.show(true);
  rig.frames.run();
  return rig;
}

afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  document.body.replaceChildren();
});

describe('vuelo entre fotos: de la posición del scroll a los estilos', () => {
  it('coloca la cámara y las tarjetas al montar, sin esperar a un cuadro (p = 0)', () => {
    const frames = fakeFrames();
    const { outer, space, cards } = buildFlight();
    stops.push(runFlight(outer));

    expect(frames.request).not.toHaveBeenCalled();
    expect(space.style.transform).toBe('translate3d(0px, 0px, 30px)');
    expect(cards.map((card) => card.style.transform)).toEqual(
      [-100, -200, -300, -400].map((z) => `translate3d(0px, -50%, ${z}px)`),
    );
    expect(cards.map((card) => card.style.opacity)).toEqual(['1', '0.784', '0', '0']);
    expect(cards.map((card) => card.style.visibility)).toEqual(['visible', 'visible', 'hidden', 'hidden']);
  });

  it.each([
    [-1000, 'translate3d(0px, 0px, 130px)', ['oculta', '1', '0.784', 'oculta']], // p = 0,25
    [-2000, 'translate3d(0px, 0px, 230px)', ['oculta', 'oculta', '1', '0.784']], // p = 0,5
    [-3940, 'translate3d(0px, 0px, 424px)', ['oculta', 'oculta', 'oculta', '0.5']], // p = 0,985: la última pasa, z = 24
    [-4000, 'translate3d(0px, 0px, 430px)', ['oculta', 'oculta', 'oculta', 'oculta']], // p = 1: solo el fondo
    [-9000, 'translate3d(0px, 0px, 430px)', ['oculta', 'oculta', 'oculta', 'oculta']], // la sección ya pasó
  ])('con la sección en top = %i px', (top, space, cards) => {
    const { frames, scrollTo, seen } = fly();
    scrollTo(top);
    frames.run();
    expect(seen()).toEqual({ space, cards });
  });

  it('una posición intermedia cualquiera no deja decimales sin fin en el estilo', () => {
    const { frames, scrollTo, seen } = fly();
    scrollTo(-1234.5678); // p = 0,30864195 → cámara 153,45678
    frames.run();
    expect(seen().space).toBe('translate3d(0px, 0px, 153.457px)');
  });

  it('el scroll hacia arriba revierte exacto: se recalcula todo cada vez', () => {
    const { frames, scrollTo, seen } = fly();
    const start = seen();
    expect(start.cards).toEqual(['1', '0.784', 'oculta', 'oculta']);
    scrollTo(-2600);
    frames.run();
    expect(seen()).not.toEqual(start);
    scrollTo(0);
    frames.run();
    expect(seen()).toEqual(start);
  });

  it('varios eventos de scroll antes del siguiente cuadro piden un solo rAF', () => {
    const { frames, scrollTo } = fly();
    const asked = frames.request.mock.calls.length;
    scrollTo(-100);
    scrollTo(-200);
    scrollTo(-300);
    expect(frames.request).toHaveBeenCalledTimes(asked + 1);
    expect(frames.pending()).toBe(1);
  });
});
