import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contrastRatio, parseVars, resolveColor, type Rgba } from '../../../test/colorMath';
import { fakeCanvas2d } from './ribbonCanvasKit';
import { fitText, LABEL, paintLabel, readLabelPalette } from './ribbonLabel';
import { LABEL_MIN_LIGHT } from './ribbonShading';

vi.mock('../../../lib/cssToken', () => ({ cssVar: (name: string) => `token(${name})` }));
afterEach(() => vi.restoreAllMocks());

const PALETTE = { chip: 'papel', ink: 'tinta', mark: 'resalte', markInk: 'tinta-resalte', fade: 'fondo', font: "'Soria', Georgia" };
const paint = (label: string, width = 520, scale = 1.5) => {
  const painted = fakeCanvas2d();
  const canvas = document.createElement('canvas');
  paintLabel(canvas, label, PALETTE, width, scale);
  return { ...painted, canvas };
};

describe('etiqueta pintada en la textura', () => {
  it('lee los tokens semánticos del design system, no colores sueltos', () => {
    expect(readLabelPalette()).toEqual({
      chip: 'token(--bg-primary)', ink: 'token(--text-primary)', mark: 'token(--bg-highlight)',
      markInk: 'token(--text-on-accent)', fade: 'token(--bg-primary)', font: 'token(--ff-body)',
    });
  });

  it('abajo a la izquierda, en la tipografía de texto a 18 px por escala, sobre una placa de papel', () => {
    const { canvas, texts, shapes } = paint('Biblioteca El Tintal');
    expect([canvas.width, canvas.height]).toEqual([780, LABEL.band * 1.5]);
    expect(texts).toEqual([{ text: 'Biblioteca El Tintal', x: 45, y: 90, font: "400 27px 'Soria', Georgia", fill: 'tinta' }]);
    expect(shapes).toContainEqual({ kind: 'round', x: 24, y: 60, width: 27 * 0.5 * 20 + 42, height: 60, fill: 'papel' });
  });

  it('la flecha va abajo a la derecha, en una placa de resalte', () => {
    const { shapes, context } = paint('Calle 6');
    expect(shapes).toContainEqual({ kind: 'round', x: 780 - 24 - 60, y: 60, width: 60, height: 60, fill: 'resalte' });
    expect(context.stroke).toHaveBeenCalled();
  });

  it('degradado inferior suave: el papel se enmascara de transparente a opaco hacia abajo', () => {
    const { stops, composites } = paint('Calle 6');
    expect(stops).toEqual([[0, 'transparent'], [1, 'fondo']]);
    expect(composites).toEqual(['destination-in', 'source-over']);
  });

  it('una etiqueta larga se recorta con puntos suspensivos y no pisa la flecha', () => {
    const { texts, shapes } = paint('Vista a nivel de calle de la Avenida Ciudad de Cali con Américas', 360, 1);
    expect(texts[0]?.text.endsWith('…')).toBe(true);
    const chip = shapes.find((shape) => shape.fill === 'papel' && shape.kind === 'round');
    expect((chip?.x ?? 0) + (chip?.width ?? 0)).toBeLessThanOrEqual(360 - 16 - 40 - LABEL.gap);
  });

  it('fitText deja el texto entero si cabe y si no, lo corta en el último carácter que cabe', () => {
    const measure = (text: string) => text.length * 10;
    expect(fitText('Calle 6', 70, measure)).toBe('Calle 6');
    expect(fitText('Biblioteca', 60, measure)).toBe('Bibli…');
    expect(fitText('Biblioteca', 5, measure)).toBe('…');
  });
});

const read = (name: string) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../styles', name), 'utf8');
const base = parseVars(read('tokens.css'), ':root');
const high = new Map([...base, ...parseVars(read('contrast.css'), ':root.high-contrast')]);
/** El shader multiplica el color en espacio lineal: así se oscurece un sRGB de 8 bits. */
const shade = ([r, g, b]: Rgba, k: number): Rgba => [r, g, b].map((c) => {
  const s = c / 255;
  const linear = (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4) * k;
  return 255 * (linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055);
}).concat(1) as Rgba;

describe.each([['estándar', base], ['alto contraste', high]])('contraste de la etiqueta en modo %s', (_mode, vars) => {
  const pair = (fg: string, bg: string) =>
    contrastRatio(shade(resolveColor(`var(${fg})`, vars), LABEL_MIN_LIGHT), shade(resolveColor(`var(${bg})`, vars), LABEL_MIN_LIGHT));

  it('el texto sobre su placa pasa 4,5:1 aun con el brillo más bajo que le da el shader', () => {
    expect(pair('--text-primary', '--bg-primary')).toBeGreaterThanOrEqual(4.5);
  });

  it('la flecha sobre su placa pasa 3:1 (gráfico)', () => {
    expect(pair('--text-on-accent', '--bg-highlight')).toBeGreaterThanOrEqual(3);
  });
});
