import { describe, expect, it } from 'vitest';
import { titleTone } from './timelineTone';

// CLAUDE.md (D100): marrón como texto solo sobre crema y GRANDE (≥ 24 px, o ≥ 18,66 px en negrita).
// El h3 va en Cormorant a peso 600 (type.css), que WCAG y axe no cuentan como negrita: el título
// marrón debe medir ≥ 24 px en todo ancho (1,5rem en el celular; step-2 ≥ 26 px desde 768 px).
describe('títulos de la línea de tiempo', () => {
  it('los pares van en negro, a su tamaño de siempre', () => {
    expect(titleTone(0)).toBe('text-step-1 text-fg');
    expect(titleTone(2)).toBe('text-step-1 text-fg');
  });

  it('los marrones (sobre crema) miden ≥ 24 px en todo ancho y nunca usan step-1', () => {
    const brown = titleTone(1).split(' ');
    expect(brown).toEqual(expect.arrayContaining(['text-title', 'text-[1.5rem]', 'md:text-step-2']));
    expect(brown).not.toContain('text-step-1');
  });

  it('la tarjeta que desde 768 px pasa a rosa vuelve al negro allí (nunca marrón sobre rosa)', () => {
    const wide = titleTone(3).split(' ');
    expect(wide).toEqual(expect.arrayContaining(['text-title', 'text-[1.5rem]', 'md:text-fg', 'md:text-step-1']));
    expect(wide).not.toContain('md:text-step-2');
  });
});
