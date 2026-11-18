import { render } from '@testing-library/react';
import type { Geometry } from 'geojson';
import { describe, expect, it } from 'vitest';
import { MODES, THEME, type Vars } from '../../test/classContrast';
import { contrastRatio, over, resolveColor, type Rgba } from '../../test/colorMath';
import { LocatorMap } from './LocatorMap';

// PAL-05 (WCAG 1.4.11): El Tintal es el dato de la figura y debe recortarse sobre Kennedy a ≥ 3:1,
// en el modo normal y en el Alto Contraste de la app; la leyenda muestra lo mismo que el mapa.
const square = (x: number, y: number, size: number): Geometry => ({
  type: 'Polygon', coordinates: [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]],
});
const KENNEDY = square(-74.2, 4.58, 0.1);
const TINTAL = square(-74.19, 4.64, 0.03);

const classes = (element: Element | undefined) => element?.getAttribute('class') ?? '';
/** Nombre de la utilidad de color (`fill-active` → `active`) y su opacidad (`/60`). */
function utility(names: string, kind: string): [string, number] {
  const [, name = '', alpha] = new RegExp(`(?:^|\\s)${kind}-([\\w-]+?)(?:/(\\d+))?(?=\\s|$)`).exec(names) ?? [];
  if (!THEME.has(name)) throw new Error(`Sin ${kind}-* de la paleta en «${names}»`);
  return [name, alpha ? Number(alpha) / 100 : 1];
}
function colorOf(names: string, kind: string, vars: Vars, under: Rgba): Rgba {
  const [name, alpha] = utility(names, kind);
  const [r, g, b, a] = resolveColor(THEME.get(name) ?? '', vars);
  return over([r, g, b, a * alpha], under);
}
function draw() {
  const { container } = render(<LocatorMap kennedy={KENNEDY} tintal={TINTAL} />);
  const [kennedy, tintal] = [...container.querySelectorAll('path')];
  const [kennedyKey, tintalKey] = [...container.querySelectorAll('figcaption [aria-hidden="true"]')];
  return { kennedy, tintal, kennedyKey, tintalKey };
}

describe.each(MODES)('mapa de ubicación de Historia, en modo %s', (_mode, vars) => {
  const page = resolveColor('var(--bg-primary)', vars);

  it('El Tintal se recorta sobre Kennedy con un borde de ≥ 3:1 y 2 px reales', () => {
    const { kennedy, tintal } = draw();
    const ground = colorOf(classes(kennedy), 'fill', vars, page);
    expect(contrastRatio(colorOf(classes(tintal), 'stroke', vars, ground), ground)).toBeGreaterThanOrEqual(3);
    expect(Number(tintal?.getAttribute('stroke-width'))).toBeGreaterThanOrEqual(2);
    expect(tintal).toHaveAttribute('vector-effect', 'non-scaling-stroke'); // no adelgaza en el celular
  });

  it('su relleno o su borde lo distinguen de Kennedy (≥ 3:1): las dos muestras no se confunden', () => {
    const { kennedy, tintal } = draw();
    const [k, t] = [classes(kennedy), classes(tintal)];
    const kFill = colorOf(k, 'fill', vars, page);
    const fills = contrastRatio(colorOf(t, 'fill', vars, kFill), kFill);
    const edges = contrastRatio(colorOf(t, 'stroke', vars, kFill), colorOf(k, 'stroke', vars, page));
    expect(Math.max(fills, edges)).toBeGreaterThanOrEqual(3);
  });
});

describe('leyenda del mapa de ubicación', () => {
  it('cada muestra lleva el relleno y el borde de su área en el mapa', () => {
    const { kennedy, tintal, kennedyKey, tintalKey } = draw();
    for (const [area, key] of [[kennedy, kennedyKey], [tintal, tintalKey]] as const) {
      expect(utility(classes(key), 'bg')).toEqual(utility(classes(area), 'fill'));
      expect(utility(classes(key), 'border')).toEqual(utility(classes(area), 'stroke'));
    }
  });

  // Revisión de PAL-05: El Tintal es un dato de la figura, no una selección; con su propio token, cambiar
  // el color de selección de la interfaz no cambia el mapa (sus contrastes los miden las pruebas de arriba).
  it('El Tintal tiene su propio token, no el de selección', () => {
    const { tintal } = draw();
    const [name] = utility(classes(tintal), 'fill');
    expect(THEME.get(name)).not.toBe('var(--interactive-active)');
    expect(THEME.get(name)).toBe('var(--figure-highlight)');
  });
});
