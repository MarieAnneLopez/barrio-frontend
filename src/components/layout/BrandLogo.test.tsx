import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/renderRoute';
import { BrandLogo } from './BrandLogo';

const logo = () => screen.getByRole('img', { name: 'Reconoce tu Barrio: El Tintal' });
const WIDE = '(min-width: 640px)';
const denser = (dppx: number, and = '') =>
  [`(min-resolution: ${dppx}dppx)`, `(-webkit-min-device-pixel-ratio: ${dppx})`].map((q) => `${and}${q}`).join(', ');

describe('Logo del encabezado (D82, D86)', () => {
  it('es el rostro sonriente de Mini Marie con el nombre del sitio', async () => {
    renderRoute('/');
    const inHeader = await screen.findByRole('img', { name: 'Reconoce tu Barrio: El Tintal' });
    expect(inHeader.closest('header')).not.toBeNull();
    expect(inHeader.querySelector('img')?.getAttribute('src')).toBe('/assets/brand/marie-logo-32.png');
  });

  it('a escala entera: 32 px en móvil y 48 px desde 640 px, con el múltiplo exacto en pantallas densas', () => {
    render(<BrandLogo />);
    const sources = [...logo().querySelectorAll('source')].map((s) => [s.getAttribute('media'), s.getAttribute('srcset')]);
    expect(sources).toEqual([
      [denser(1.01, `${WIDE} and `), '/assets/brand/marie-logo-96.png'], // 48 px × 2
      [WIDE, '/assets/brand/marie-logo-48.png'],
      [denser(2.01), '/assets/brand/marie-logo-96.png'], // 32 px × 3
      [denser(1.01), '/assets/brand/marie-logo-64.png'], // 32 px × 2
    ]);
    expect(logo().className).toMatch(/\bsize-8\b.*\bsm:size-12\b/);
  });

  it('va en un círculo con línea de 1 px, sin borde grueso ni sombra', () => {
    render(<BrandLogo />);
    expect(logo().className).toMatch(/(^| )border( |$)/);
    expect(logo().className).not.toMatch(/border-2|shadow/);
  });
});
