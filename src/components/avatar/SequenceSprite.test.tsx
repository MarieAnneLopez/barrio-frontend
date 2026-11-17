import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { SequenceSprite } from './SequenceSprite';

const strip = () => document.querySelector<HTMLImageElement>('.sequence__strip');
const box = () => document.querySelector<HTMLElement>('.sequence');
/** [media, recurso] de cada <source>, en el orden en que el navegador las evalúa. */
const sources = () => [...document.querySelectorAll('.sequence source')].map((s) => [s.getAttribute('media'), s.getAttribute('srcset')]);
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'sequence.css'), 'utf8');

beforeEach(() => act(() => useA11yStore.getState().reset()));

describe('SequenceSprite a escala entera (D86)', () => {
  it('a 1× sirve el recurso de su tamaño; en pantallas más densas, el doble o el cuádruple exactos', () => {
    render(<SequenceSprite name="wave" size={160} />);
    expect(strip()?.getAttribute('src')).toBe('/assets/avatar/wave/wave_160.webp');
    expect(strip()?.hasAttribute('srcset')).toBe(false); // sin srcset: a 125 % el navegador elegiría el pequeño
    expect(sources()).toEqual([
      ['(min-resolution: 2.01dppx), (-webkit-min-device-pixel-ratio: 2.01)', '/assets/avatar/wave/wave_640.webp'],
      ['(min-resolution: 1.01dppx), (-webkit-min-device-pixel-ratio: 1.01)', '/assets/avatar/wave/wave_320.webp'],
    ]);
  });

  it('solo ofrece los múltiplos que existen', () => {
    render(<SequenceSprite name="run" size={210} />);
    expect(sources().map(([, url]) => url)).toEqual(['/assets/avatar/run/run_420.webp']);
  });

  it.each([['wave', 640], ['run', 420], ['sit', 192]] as const)('%s a %i px (el mayor) no tiene recurso más denso', (name, size) => {
    render(<SequenceSprite name={name} size={size} />);
    expect(sources()).toEqual([]);
  });

  it('la celda y la tira miden píxeles enteros: el paso de la animación no tiembla', () => {
    render(<SequenceSprite name="wave" size={160} />);
    expect(box()?.style.width).toBe('82px');
    expect(box()?.style.height).toBe('160px');
    expect(strip()?.style.width).toBe('574px'); // 7 cuadros × 82 px
    expect(box()).toHaveAttribute('data-playing');
  });

  it('con movimiento reducido queda en la pose pedida, en píxeles enteros', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    render(<SequenceSprite name="wave" size={160} pose={2} />);
    expect(box()).not.toHaveAttribute('data-playing');
    expect(strip()?.style.transform).toBe('translateX(-164px)');
  });

  it('rechaza un tamaño que no es de la secuencia (nada de escalas intermedias)', () => {
    // @ts-expect-error: tampoco compila (spriteSizes.test.tsx); aquí se prueba la guarda al pintar
    expect(() => render(<SequenceSprite name="sit" size={36} />)).toThrow(/sit/);
  });

  it('sin suavizado solo donde el dibujo cae en píxeles enteros de pantalla (1× y 2×)', () => {
    expect(css.match(/image-rendering/g)).toHaveLength(1);
    expect(css).toMatch(/@media \(resolution: 1dppx\), \(resolution: 2dppx\) \{\s*\.sequence__strip \{\s*image-rendering: pixelated;/);
  });
});
