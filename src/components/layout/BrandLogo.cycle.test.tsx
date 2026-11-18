import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { FRAME_MS } from '../avatar/sequences';
import { BrandLogo } from './BrandLogo';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'brand-logo.css'), 'utf8');
const WIDE = '(min-width: 640px)';
const denser = (dppx: number, and = '') =>
  [`(min-resolution: ${dppx}dppx)`, `(-webkit-min-device-pixel-ratio: ${dppx})`].map((q) => `${and}${q}`).join(', ');
const face = (size: number) => `/assets/brand/marie-face-${size}.webp`;
const cycle = () => screen.getByRole('img', { name: 'Reconoce tu Barrio: El Tintal' }).querySelector<HTMLElement>('.brand-logo__cycle');
const atlas = () => cycle()?.querySelector<HTMLImageElement>('img') ?? null;
let idle: (() => void) | undefined;
const decode = vi.fn(() => Promise.resolve());

beforeEach(() => {
  act(() => useA11yStore.getState().reset());
  idle = undefined;
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => ((idle = callback), 1));
  vi.stubGlobal('cancelIdleCallback', () => undefined);
  Object.defineProperty(HTMLImageElement.prototype, 'decode', { value: decode, configurable: true });
  Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
});

afterEach(() => {
  Reflect.deleteProperty(document, 'readyState');
  Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
});

/** La página terminó de cargar y el navegador quedó libre. */
const settle = () => act(() => {
  window.dispatchEvent(new Event('load'));
  idle?.();
});

// Auditoría MM-04: el logo era un PNG fijo de un cuadro. Ahora respira con el ciclo de reposo de
// 32 cuadros; el PNG queda de póster (es su cuadro 0) para no tocar el primer pintado.
describe('logo del encabezado: Mini Marie respira (ciclo de 32 cuadros)', () => {
  it('el primer pintado es el póster: el atlas se pide tras el load, con el navegador libre', () => {
    render(<BrandLogo />);
    expect(cycle()).toBeNull();
    act(() => window.dispatchEvent(new Event('load')));
    expect(cycle()).toBeNull(); // falta el respiro del navegador
    act(() => idle?.());
    const sources = [...(cycle()?.querySelectorAll('source') ?? [])].map((s) => [s.getAttribute('media'), s.getAttribute('srcset')]);
    expect(sources).toEqual([[denser(1.01, `${WIDE} and `), face(96)], [WIDE, face(48)], [denser(2.01), face(96)], [denser(1.01), face(64)]]);
    expect(atlas()).toHaveAttribute('src', face(32));
  });

  it('se ve cuando su imagen ya está decodificada; si no se puede, queda el póster', async () => {
    render(<BrandLogo />);
    settle();
    expect(cycle()).not.toHaveAttribute('data-shown');
    decode.mockReturnValueOnce(Promise.reject(new Error('sin decodificar')));
    await act(async () => void fireEvent.load(atlas() as HTMLImageElement));
    expect(cycle()).not.toHaveAttribute('data-shown');
    await act(async () => void fireEvent.load(atlas() as HTMLImageElement));
    expect(cycle()).toHaveAttribute('data-shown');
  });

  it('a 12 cuadros por segundo: la imagen recorre 8 columnas y su contenedor baja 4 filas', () => {
    render(<BrandLogo />);
    settle();
    const rows = cycle()?.querySelector<HTMLElement>('.brand-logo__rows');
    expect(parseFloat(atlas()?.style.animationDuration ?? '')).toBeCloseTo(8 * FRAME_MS.idle, 2); // 667 ms por fila
    expect(parseFloat(rows?.style.animationDuration ?? '')).toBeCloseTo(32 * FRAME_MS.idle, 2); // 2,67 s el ciclo
    expect(css).toMatch(/\.brand-logo__cycle\[data-shown\] \.brand-logo__atlas \{[^}]*brand-logo-columns;[^}]*steps\(8\)/);
    expect(css).toMatch(/\.brand-logo__cycle\[data-shown\] \.brand-logo__rows \{[^}]*brand-logo-rows;[^}]*steps\(4\)/);
  });

  it('mismas medidas que el póster: cubre el círculo con su fondo y 8 × 4 cuadros de 32 o 48 px', () => {
    expect(css).toMatch(/\.brand-logo__cycle \{[^}]*inset: 0;[^}]*background-color: inherit;/);
    expect(css).toMatch(/\.brand-logo__atlas \{[^}]*width: 256px;[^}]*height: 128px;/);
    expect(css).toMatch(/@media \(min-width: 640px\) \{\s*\.brand-logo__atlas \{\s*width: 384px;\s*height: 192px;/);
  });

  it('con movimiento reducido queda quieto: el póster, sin pedir el atlas', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    render(<BrandLogo />);
    settle();
    expect(cycle()).toBeNull();
  });
});
