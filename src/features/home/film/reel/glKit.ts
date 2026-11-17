// Dobles de WebGL y de canvas 2D para las pruebas del reel: en jsdom no existe ninguno de los dos.
// El renderer de mentira sustituye a WebGLRenderer con vi.mock('three', …) en cada prueba que lo usa.
import { vi } from 'vitest';

/** Estado compartido con las pruebas: renderers creados y si el navegador niega el contexto WebGL. */
export const gl = { renderers: [] as FakeRenderer[], fail: false };

export class FakeRenderer {
  domElement: HTMLCanvasElement;
  capabilities = { getMaxAnisotropy: () => 8 };
  setPixelRatio = vi.fn();
  setSize = vi.fn();
  render = vi.fn();
  dispose = vi.fn();
  forceContextLoss = vi.fn();
  parameters: Record<string, unknown>;

  constructor(parameters: { canvas?: HTMLCanvasElement } = {}) {
    this.parameters = parameters;
    this.domElement = parameters.canvas ?? document.createElement('canvas');
    gl.renderers.push(this);
  }
}

/**
 * `three` de verdad (geometría, materiales, rayos) con el renderer de mentira. Se usa así, con import
 * dinámico porque vi.mock se ejecuta antes que los imports del archivo:
 * vi.mock('three', async (original) => (await import('./glKit')).fakeThree(original));
 */
export async function fakeThree(original: () => Promise<unknown>) {
  return { ...((await original()) as object), WebGLRenderer: FakeRenderer };
}

/** Deja el entorno como un navegador con WebGL 2 y un lienzo de 1440 × 836 px. */
export function fakeWebGL(width = 1440, height = 836): void {
  gl.renderers.length = 0;
  gl.fail = false;
  vi.stubGlobal('WebGL2RenderingContext', Object); // basta con que exista: el contexto lo da el canvas
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(height);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
}

interface Text {
  text: string;
  x: number;
  y: number;
  fill: string;
  font: string;
}
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

/**
 * Sustituye getContext: '2d' da un contexto que apunta lo que se pinta (cada letra mide medio cuerpo,
 * como en coverLayout.test) y 'webgl2' da un contexto cualquiera, o null si gl.fail.
 */
export function fakeCanvas2d() {
  const texts: Text[] = [];
  const rects: Rect[] = [];
  const context = {
    fillStyle: '',
    font: '',
    textBaseline: '',
    fillRect(x: number, y: number, width: number, height: number) {
      rects.push({ x, y, width, height, fill: context.fillStyle });
    },
    fillText(text: string, x: number, y: number) {
      texts.push({ text, x, y, fill: context.fillStyle, font: context.font });
    },
    measureText: (text: string) => ({ width: text.length * Number(/(\d+)px/.exec(context.font)?.[1] ?? 0) * 0.5 }),
  };
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext') as unknown as {
    mockImplementation(fake: (type: string) => unknown): void;
    mock: { calls: unknown[][] };
  };
  getContext.mockImplementation((type) => (type === '2d' ? context : gl.fail ? null : { getExtension: () => null }));
  return { texts, rects, requested: getContext.mock.calls };
}
