import { describe, expect, it } from 'vitest';
import { titleTone } from '../features/history/timelineTone';
import { FONT_SCALES } from '../store/a11yStore';
import { readSrc } from '../test/classContrast';
import { parseVars } from '../test/colorMath';
import { cssPx } from '../test/cssLength';

// PAL-04 (D100, D110): crema sobre marrón y marrón sobre crema (3,56:1) solo pasan como texto grande,
// y lo son en px reales con cualquier letra de la barra de accesibilidad, también al 90 %: el CTA
// ≥ 18,66 px en Inter 700 y los títulos marrón ≥ 24 px (Cormorant 600 y Anton 400 no son negrita).
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const rule = (css: string, selector: string) =>
  new RegExp(`(?:^|\\n|\\})\\s*${selector.replace(/[.[\]]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(strip(css))?.[1] ?? '';
/** La última declaración de font-size de la regla: la que usa un navegador que la entiende. */
const fontSize = (body: string) => [...body.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1] ?? '').at(-1) ?? '';
const scale = parseVars(readSrc('styles', 'scale.css'), ':root');
const NARROW = [320, 390, 767];
const WIDE = [768, 1024, 1440, 1920];

/** Tamaño de una clase de Tailwind (`text-step-2`, `text-[length:…]`) como expresión CSS. */
function sizeOf(classes: string[], prefix: string): string | undefined {
  for (const name of classes) {
    const step = new RegExp(`^${prefix}text-step-(-?\\d)$`).exec(name)?.[1];
    if (step !== undefined) return `var(--step-${step})`;
    const raw = new RegExp(`^${prefix}text-\\[(?:length:)?([^\\]]+)\\]$`).exec(name)?.[1];
    if (raw !== undefined) return raw.replace(/_/g, ' ');
  }
  return undefined;
}

describe('medidor de longitudes CSS', () => {
  it('evalúa rem, px, vw, max(), min(), clamp() y var() como un navegador', () => {
    expect(cssPx('max(1.1875rem, 19px)', { rem: 14.4, width: 390 })).toBe(19);
    expect(cssPx('var(--step-2)', { rem: 16, width: 1440, vars: scale })).toBeCloseTo(30);
    expect(cssPx('min(calc(2 * 10px), (52svh - 10rem) / (2 * 0.5))', { rem: 10, width: 400, height: 400 })).toBe(20);
  });
});

describe.each(FONT_SCALES)('con la letra al %s', (fontScale) => {
  const at = (width: number, height = 844, extra: [string, string][] = []) =>
    ({ rem: 16 * fontScale, width, height, vars: new Map([...scale, ...extra]) });

  it('el CTA mide ≥ 18,66 px reales en Inter 700, en todo ancho', () => {
    const body = rule(readSrc('components', 'ui', 'ui.css'), '.ui-btn--primary');
    expect(body).toContain('font-weight: 700;');
    expect(body).toContain('font-family: var(--ff-heading);');
    for (const width of [...NARROW, ...WIDE]) expect(cssPx(fontSize(body), at(width))).toBeGreaterThanOrEqual(18.66);
  });

  it('el título marrón de los hitos mide ≥ 24 px reales donde es marrón', () => {
    for (const index of [1, 3, 5, 7]) {
      const classes = titleTone(index).split(' ');
      if (!classes.includes('text-title')) continue;
      const base = sizeOf(classes, '') ?? 'var(--step-0)';
      for (const width of NARROW) expect(cssPx(base, at(width)), `hito ${index} a ${width}`).toBeGreaterThanOrEqual(24);
      if (classes.includes('md:text-fg')) continue; // desde 768 px vuelve al negro
      for (const width of WIDE) {
        expect(cssPx(sizeOf(classes, 'md:') ?? base, at(width)), `hito ${index} a ${width}`).toBeGreaterThanOrEqual(24);
      }
    }
  });

  it('el titular de la entrada (marrón sobre crema) no baja de 24 px, ni en un celular apaisado', () => {
    const body = rule(readSrc('components', 'intro', 'section-intro.css'), '.intro__title');
    const vars: [string, string][] = [['--fit', '16.2'], ['--lines', '3'], ['--leading', '0.96']];
    for (const [width, height] of [[568, 320], [844, 390], [390, 844], [1440, 900]] as const) {
      expect(cssPx(fontSize(body), at(width, height, vars)), `${width} × ${height}`).toBeGreaterThanOrEqual(24);
    }
  });

  it('el nombre del sitio en la banda marrón del pie (crema, Anton 400) mide ≥ 24 px', () => {
    const chunk = readSrc('components', 'layout', 'Footer.tsx').split(/['"`]/).find((c) => c.includes('text-on-band'));
    const classes = (chunk ?? '').split(/\s+/);
    const base = sizeOf(classes, '') ?? 'var(--step-0)';
    for (const width of NARROW) expect(cssPx(base, at(width))).toBeGreaterThanOrEqual(24);
    for (const width of WIDE) expect(cssPx(sizeOf(classes, 'md:') ?? base, at(width))).toBeGreaterThanOrEqual(24);
  });
});
