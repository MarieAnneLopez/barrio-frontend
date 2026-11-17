import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLoadingScreenStore } from '../../../../store/loadingScreenStore';
import { useWelcomeStore } from '../../../../store/welcomeStore';
import { playManifesto } from './playManifesto';
import { buildStage, fakeFrames, fakeViewport, setTabHidden } from './testDoubles';

const stops: (() => void)[] = [];

function play() {
  const frames = fakeFrames();
  const view = fakeViewport();
  const stage = buildStage();
  const stop = playManifesto(stage.section, { onCover: vi.fn(), onEnd: vi.fn() });
  stops.push(stop);
  /** Entra en vista y avanza 100 ms: la primera palabra va por raw = 0,1143 (opacidad 0,5714). */
  const start = () => {
    view.show(true);
    frames.run(1000);
    frames.advance(1000, 100);
  };
  return { frames, view, ...stage, stop, start };
}

afterEach(() => {
  stops.splice(0).forEach((stop) => stop()); // ninguna reproducción queda escuchando para la prueba siguiente
  setTabHidden();
  useLoadingScreenStore.setState({ visible: false });
  document.body.replaceChildren();
});

describe('pausas y limpieza del manifiesto', () => {
  it('con la pestaña oculta suelta el cuadro pendiente y, al volver, sigue donde iba (no acumula tiempo)', () => {
    const { frames, words, start } = play();
    start();
    expect(words[0]?.style.opacity).toBe('0.5714');

    setTabHidden(true);
    expect(frames.pending()).toBe(0);
    setTabHidden(false);
    expect(frames.pending()).toBe(1);
    frames.run(90_000); // minuto y medio después: el primer cuadro no suma nada
    expect(words[0]?.style.opacity).toBe('0.5714');
    frames.run(90_012.5);
    expect(words[0]?.style.opacity).toBe('0.6429'); // 5 · (0,1125 / 0,875)
  });

  it('fuera de pantalla también se detiene, y se reanuda al volver a verse', () => {
    const { frames, view, words, start } = play();
    start();
    view.show(false);
    expect(frames.pending()).toBe(0);
    view.show(true);
    frames.run(50_000);
    expect(words[0]?.style.opacity).toBe('0.5714');
    expect(frames.pending()).toBe(1);
  });

  it('espera a que se quiten la pantalla de carga y la bienvenida, que tapan toda la página', () => {
    useLoadingScreenStore.setState({ visible: true });
    const { frames, view } = play();
    view.show(true);
    expect(frames.pending()).toBe(0);

    useLoadingScreenStore.setState({ visible: false });
    expect(frames.pending()).toBe(1);
    useWelcomeStore.setState({ open: true });
    expect(frames.pending()).toBe(0);
    useWelcomeStore.setState({ open: false });
    expect(frames.pending()).toBe(1);
  });

  it('la limpieza cancela el cuadro pendiente, suelta observadores y oyentes, y borra los estilos en línea', () => {
    const { frames, view, words, paper, stop, start } = play();
    start();
    const pendingId = frames.request.mock.results.at(-1)?.value as number;

    stop();
    expect(frames.cancel).toHaveBeenCalledWith(pendingId);
    expect(frames.pending()).toBe(0);
    expect(view.observers()).toBe(0);
    expect(words.map((word) => word.getAttribute('style') ?? '')).toEqual(Array(10).fill(''));
    expect(paper.getAttribute('style') ?? '').toBe('');

    const asked = frames.request.mock.calls.length;
    setTabHidden(true);
    setTabHidden(false);
    useLoadingScreenStore.setState({ visible: true });
    useLoadingScreenStore.setState({ visible: false });
    view.show(true);
    expect(frames.request).toHaveBeenCalledTimes(asked); // ya nadie escucha
  });
});
