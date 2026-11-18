import { describe, expect, it } from 'vitest';
import { MODES, readSrc } from '../../test/classContrast';
import { contrastRatio, resolveColor } from '../../test/colorMath';

// PAL-09 (D100: el amarillo es el de las estrellas): las llenas en amarillo con un contorno que se
// recorta sobre el fondo (≥ 3:1, WCAG 1.4.11) y las vacías, solo con el contorno. Llenas y vacías se
// distinguen también sin el tono: cambia el contorno (normal) o el relleno (alto contraste).
const css = readSrc('components', 'ui', 'stars.css').replace(/\/\*[\s\S]*?\*\//g, '');
const block = (selector: string) =>
  new RegExp(`(?:^|\\n)${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
const prop = (body: string, name: string) => new RegExp(`(?:^|[\\s;])${name}:\\s*([^;]+);`).exec(body)?.[1]?.trim();

/** Colores de una estrella llena y del contorno de una vacía, con la regla de alto contraste si toca. */
function starColors(high: boolean) {
  const [full, override] = [block('.stars-full'), high ? block(':root.high-contrast .stars-full') : ''];
  return {
    fill: prop(override, 'fill') ?? prop(full, 'fill') ?? '',
    stroke: prop(override, 'stroke') ?? prop(full, 'stroke') ?? '',
    empty: prop(block('.stars-empty'), 'stroke') ?? '',
  };
}

describe('estrellas de calificación', () => {
  it('llenas en el token del amarillo; vacías sin relleno', () => {
    expect(prop(block('.stars-full'), 'fill')).toBe('var(--bg-highlight)');
    expect(resolveColor('var(--bg-highlight)', MODES[0]?.[1] ?? new Map())).toEqual([253, 207, 118, 1]); // #fdcf76
    expect(prop(block('.stars-empty'), 'fill')).toBe('transparent');
  });

  describe.each(MODES)('en modo %s', (mode, vars) => {
    const star = starColors(mode !== 'estándar');
    const color = (value: string) => resolveColor(value, vars);

    it.each(['--bg-primary', '--bg-surface'])('el contorno de las llenas y el de las vacías se recortan sobre %s (≥ 3:1)', (bg) => {
      expect(contrastRatio(color(star.stroke), color(`var(${bg})`))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color(star.empty), color(`var(${bg})`))).toBeGreaterThanOrEqual(3);
    });

    it('una llena y una vacía no se confunden: cambia el contorno o el relleno (≥ 3:1)', () => {
      const byFill = contrastRatio(color(star.fill), color('var(--bg-surface)'));
      const byEdge = contrastRatio(color(star.stroke), color(star.empty));
      expect(Math.max(byFill, byEdge)).toBeGreaterThanOrEqual(3);
    });
  });
});
