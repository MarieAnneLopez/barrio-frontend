import { afterEach, describe, expect, it, vi } from 'vitest';
import { runFlight } from './flightScene';
import { flightRig, setTabHidden } from './testDoubles';

const stops: (() => void)[] = [];
const HALF = 'translate3d(0px, 0px, 230px)'; // p = 0,5

function fly() {
  const rig = flightRig();
  const stop = runFlight(rig.outer);
  stops.push(stop);
  rig.view.show(true);
  rig.frames.run();
  return { ...rig, stop };
}

afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  setTabHidden();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('vuelo entre fotos: oyentes, pausas y limpieza', () => {
  it('el oyente de scroll es pasivo: nunca frena el scroll nativo', () => {
    const add = vi.spyOn(window, 'addEventListener');
    fly();
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it.each(['resize', 'orientationchange'])('recalcula también con %s', (name) => {
    const { frames, layout, seen } = fly();
    layout.top = -2000;
    window.dispatchEvent(new Event(name));
    frames.run();
    expect(seen().space).toBe(HALF);
  });

  it('recalcula cuando cambia el tamaño de la sección (ResizeObserver)', () => {
    const { frames, size, layout, seen } = fly();
    layout.screen = 3000; // la pantalla crece: D pasa de 4000 a 2000
    layout.top = -1000;
    size.resize();
    frames.run();
    expect(seen().space).toBe(HALF); // p = 1000 / 2000
  });

  it('fuera de pantalla no pide cuadros con el scroll; al salir y al volver a entrar se pone al día', () => {
    const { frames, view, scrollTo, seen } = fly();
    view.show(false);
    frames.run(); // al salir, un último cuadro deja el estado en su sitio
    const asked = frames.request.mock.calls.length;
    scrollTo(-2000);
    scrollTo(-2100);
    expect(frames.request).toHaveBeenCalledTimes(asked);

    scrollTo(-2000);
    view.show(true);
    expect(frames.pending()).toBe(1);
    frames.run();
    expect(seen().space).toBe(HALF);
  });

  it('con la pestaña oculta tampoco; al volver, un cuadro la pone al día', () => {
    const { frames, scrollTo, seen } = fly();
    setTabHidden(true);
    const asked = frames.request.mock.calls.length;
    scrollTo(-2000);
    expect(frames.request).toHaveBeenCalledTimes(asked);

    setTabHidden(false);
    expect(frames.pending()).toBe(1);
    frames.run();
    expect(seen().space).toBe(HALF);
  });

  it('la limpieza cancela el cuadro pendiente, quita oyentes y observadores y borra los estilos en línea', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { frames, view, size, scrollTo, space, cards, stop } = fly();
    scrollTo(-2000);
    const pendingId = frames.request.mock.results.at(-1)?.value as number;

    stop();
    expect(frames.cancel).toHaveBeenCalledWith(pendingId);
    expect(frames.pending()).toBe(0);
    expect(remove.mock.calls.map(([name]) => name).sort()).toEqual(['orientationchange', 'resize', 'scroll']);
    expect([view.observers(), size.observers()]).toEqual([0, 0]);
    expect([space, ...cards].map((node) => node.getAttribute('style') ?? '')).toEqual(Array(5).fill(''));

    const asked = frames.request.mock.calls.length;
    scrollTo(-3000);
    window.dispatchEvent(new Event('resize'));
    setTabHidden(true);
    setTabHidden(false);
    expect(frames.request).toHaveBeenCalledTimes(asked); // ya nadie escucha
  });
});
