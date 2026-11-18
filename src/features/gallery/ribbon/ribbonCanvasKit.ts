// Doble del canvas 2D para las pruebas de la cinta (jsdom no lo trae): apunta lo que se pinta. Cada
// letra mide medio cuerpo. 'webgl2' da un contexto cualquiera, o null si `webgl.fail`.
import { vi } from 'vitest';

export const webgl = { fail: false };

interface Text { text: string; x: number; y: number; font: string; fill: string }
interface Shape { kind: string; x: number; y: number; width: number; height: number; fill: string }

export function fakeCanvas2d() {
  const texts: Text[] = [];
  const shapes: Shape[] = [];
  const stops: [number, string][] = [];
  const composites: string[] = [];
  const images: unknown[] = [];
  const context = {
    fillStyle: '' as unknown,
    strokeStyle: '',
    font: '',
    textBaseline: '',
    lineWidth: 1,
    lineCap: '',
    lineJoin: '',
    globalAlpha: 1,
    set globalCompositeOperation(value: string) {
      composites.push(value);
    },
    clearRect: vi.fn(),
    fillRect(x: number, y: number, width: number, height: number) {
      shapes.push({ kind: 'rect', x, y, width, height, fill: String(context.fillStyle) });
    },
    roundRect(x: number, y: number, width: number, height: number) {
      shapes.push({ kind: 'round', x, y, width, height, fill: String(context.fillStyle) });
    },
    arc: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    drawImage: (...args: unknown[]) => images.push(args),
    fillText(text: string, x: number, y: number) {
      texts.push({ text, x, y, font: context.font, fill: String(context.fillStyle) });
    },
    measureText: (text: string) => ({ width: text.length * Number(/([\d.]+)px/.exec(context.font)?.[1] ?? 0) * 0.5 }),
    createLinearGradient: () => ({ addColorStop: (at: number, color: string) => stops.push([at, color]) }),
  };
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext') as unknown as {
    mockImplementation(fake: (type: string) => unknown): void;
    mock: { calls: unknown[][] };
  };
  getContext.mockImplementation((type) => (type === '2d' ? context : webgl.fail ? null : { getExtension: () => null }));
  return { context, texts, shapes, stops, composites, images, requested: getContext.mock.calls };
}
