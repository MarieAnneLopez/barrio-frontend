import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { SequenceSprite } from './SequenceSprite';

const atlas = () => document.querySelector<HTMLImageElement>('.sequence__strip');
const rows = () => document.querySelector<HTMLElement>('.sequence__rows');
const view = () => document.querySelector<HTMLElement>('.sequence__window');
const box = () => document.querySelector<HTMLElement>('.sequence');
/** [media, recurso] de cada <source>, en el orden en que el navegador las evalúa. */
const sources = () => [...document.querySelectorAll('.sequence source')].map((s) => [s.getAttribute('media'), s.getAttribute('srcset')]);
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'sequence.css'), 'utf8');

beforeEach(() => act(() => useA11yStore.getState().reset()));

describe('SequenceSprite a escala entera (D86)', () => {
  it('a 1× sirve el recurso de su tamaño; en pantallas más densas, el doble o el cuádruple exactos', () => {
    render(<SequenceSprite name="wave" size={160} />);
    expect(atlas()?.getAttribute('src')).toBe('/assets/avatar/wave/wave_160.webp');
    expect(atlas()?.hasAttribute('srcset')).toBe(false); // sin srcset: a 125 % el navegador elegiría el pequeño
    expect(sources()).toEqual([
      ['(min-resolution: 2.01dppx), (-webkit-min-device-pixel-ratio: 2.01)', '/assets/avatar/wave/wave_640.webp'],
      ['(min-resolution: 1.01dppx), (-webkit-min-device-pixel-ratio: 1.01)', '/assets/avatar/wave/wave_320.webp'],
    ]);
  });

  it('solo ofrece los múltiplos que existen (la carrera chica, de 105 px, tiene doble y cuádruple)', () => {
    render(<SequenceSprite name="run" size={210} />);
    expect(sources().map(([, url]) => url)).toEqual(['/assets/avatar/run/run_420.webp']);
    render(<SequenceSprite name="run" size={105} />);
    expect(sources().map(([, url]) => url)).toContain('/assets/avatar/run/run_210.webp');
  });

  it.each([['wave', 640], ['run', 420], ['sit', 192], ['idle', 560]] as const)('%s a %i px (el mayor) no tiene recurso más denso', (name, size) => {
    render(<SequenceSprite name={name} size={size} />);
    expect(sources()).toEqual([]);
  });
});

describe('SequenceSprite: ciclo de 32 cuadros en un atlas de 8 × 4 (sprites32)', () => {
  it('la caja, la ventana y el atlas miden píxeles enteros: el paso de la animación no tiembla', () => {
    render(<SequenceSprite name="wave" size={160} />);
    expect([box()?.style.width, box()?.style.height]).toEqual(['82px', '160px']); // la caja de siempre
    expect([view()?.style.width, view()?.style.height]).toEqual(['98px', '160px']); // el brazo sale por la derecha
    expect([atlas()?.style.width, atlas()?.style.height]).toEqual(['784px', '640px']); // 8 × 98, 4 × 160
    expect(box()).toHaveAttribute('data-playing');
  });

  it('dos animaciones con steps(): la imagen recorre las 8 columnas y su contenedor baja las 4 filas', () => {
    render(<SequenceSprite name="wave" size={160} phase={0.25} />);
    expect([atlas()?.style.animationDuration, atlas()?.style.animationTimingFunction]).toEqual(['400ms', 'steps(8)']);
    expect([rows()?.style.animationDuration, rows()?.style.animationTimingFunction]).toEqual(['1600ms', 'steps(4)']);
    expect([atlas()?.style.animationDelay, rows()?.style.animationDelay]).toEqual(['-400ms', '-400ms']);
  });

  it('la carrera va a 24 cuadros por segundo; el saludo y la sentada a 20; el reposo a 12', () => {
    const cycle = (name: 'run' | 'wave' | 'sit' | 'idle', size: 420 | 160 | 48 | 140) => {
      const { unmount } = render(<SequenceSprite name={name} size={size as never} />);
      const ms = parseFloat(rows()?.style.animationDuration ?? '');
      unmount();
      return Math.round((32 * 1000) / ms);
    };
    expect([cycle('run', 420), cycle('wave', 160), cycle('sit', 48), cycle('idle', 140)]).toEqual([24, 20, 20, 12]);
  });

  it('con movimiento reducido queda en el cuadro dibujado pedido, en píxeles enteros', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    render(<SequenceSprite name="wave" size={160} pose={2} />);
    expect(box()).not.toHaveAttribute('data-playing');
    // el tercer cuadro dibujado es el 11 del ciclo: columna 2, fila 1
    expect([atlas()?.style.transform, rows()?.style.transform]).toEqual(['translateX(-196px)', 'translateY(-160px)']);
  });

  it('rechaza un tamaño que no es de la secuencia (nada de escalas intermedias)', () => {
    // @ts-expect-error: tampoco compila (spriteSizes.test.tsx); aquí se prueba la guarda al pintar
    expect(() => render(<SequenceSprite name="sit" size={36} />)).toThrow(/sit/);
  });

  it('sin suavizado solo donde el dibujo cae en píxeles enteros de pantalla (1× y 2×)', () => {
    expect(css.match(/image-rendering/g)).toHaveLength(1);
    expect(css).toMatch(/@media \(resolution: 1dppx\), \(resolution: 2dppx\) \{\s*\.sequence__strip \{\s*image-rendering: pixelated;/);
  });

  it('solo anima transform: columnas en X sobre la imagen, filas en Y sobre su contenedor', () => {
    expect(css).toMatch(/@keyframes sequence-columns \{\s*from \{\s*transform: translateX\(0\);\s*\}\s*to \{\s*transform: translateX\(-100%\);/);
    expect(css).toMatch(/@keyframes sequence-rows \{\s*from \{\s*transform: translateY\(0\);\s*\}\s*to \{\s*transform: translateY\(-100%\);/);
  });
});
