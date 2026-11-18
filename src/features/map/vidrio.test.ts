import { describe, expect, it } from 'vitest';
import { readSrc } from '../../test/classContrast';
import { contrastRatio, over, parseVars, resolveColor, type Rgba } from '../../test/colorMath';

// El vidrio de la interfaz de los mapas sobre el PEOR fondo de la maqueta: compone el tinte rosa claro
// con su alfa sobre el fondo (saturado como lo hace backdrop-filter) y mide el texto negro y el botón.
const css = readSrc('features', 'map', 'vidrio.css');
const tokens = parseVars(readSrc('styles', 'tokens.css'), ':root');
const map = parseVars(readSrc('styles', 'map-palette.css'), ':root');
const TINT = resolveColor('var(--bg-accent)', tokens);
const INK = resolveColor('var(--text-on-accent)', tokens);

const alphas = new Map<string, number>();
for (const [, selector = '', value] of css.matchAll(/([^{}]+)\{\s*--vidrio-alfa:\s*(\d+)%;/g)) {
  const tones = [...selector.matchAll(/data-ciclo='(\w+)'/g)].map((m) => m[1] ?? '');
  for (const tone of selector.includes(':root') ? ['base'] : tones) alphas.set(tone, Number(value) / 100);
}
const saturation = Number(/saturate\(([\d.]+)\)/.exec(css)?.[1]);

/** saturate() de Filter Effects (matriz sobre sRGB, recortada a 0–255). */
function saturate([r, g, b]: Rgba, s: number): Rgba {
  const row = (a: number, c: number, d: number) => Math.min(255, Math.max(0, a * r + c * g + d * b));
  return [
    row(0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s),
    row(0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s),
    row(0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s),
    1,
  ];
}
const glass = (bg: Rgba, alpha: number) => over([TINT[0], TINT[1], TINT[2], alpha], saturate(bg, saturation));
const lum = (c: Rgba) => contrastRatio(c, [0, 0, 0, 1]);
const tokensOf = (re: RegExp) => [...map.keys()].filter((k) => re.test(k)).map((k) => resolveColor(`var(${k})`, map));
const NIGHT = tokensOf(/^--map-ref-\d$/); // la noche son los 8 colores medidos (D83)
const DAY = tokensOf(/^--map-dia-/);
const darkestNight = NIGHT.reduce((a, b) => (lum(b) < lum(a) ? b : a));
const lightestDay = DAY.reduce((a, b) => (lum(b) > lum(a) ? b : a));
const BLACK: Rgba = [0, 0, 0, 1];
const WHITE: Rgba = [255, 255, 255, 1];
const GRAYS = Array.from({ length: 18 }, (_, i): Rgba => [i * 15, i * 15, i * 15, 1]);

describe('vidrio de los mapas: contraste sobre el peor fondo de la maqueta', () => {
  it('declara un alfa base y uno por cada tono del ciclo, y satura el fondo', () => {
    expect([...alphas.keys()].sort()).toEqual(['amanecer', 'atardecer', 'base', 'dia', 'noche']);
    expect(saturation).toBeGreaterThan(1);
    expect(css).toMatch(/background-color: color-mix\(in srgb, var\(--bg-accent\) var\(--vidrio-alfa\), transparent\)/);
  });

  it.each(['base', 'dia', 'atardecer', 'noche', 'amanecer'])('texto negro ≥ 4,5:1 en el tono %s', (tone) => {
    const alpha = alphas.get(tone) ?? 0;
    for (const bg of [darkestNight, lightestDay, BLACK, WHITE]) {
      expect(contrastRatio(INK, glass(bg, alpha)), `${tone} sobre ${bg.join()}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(['base', 'dia', 'atardecer', 'noche', 'amanecer'])('botón del panel ≥ 3:1 sobre cualquier fondo (%s)', (tone) => {
    const alpha = alphas.get(tone) ?? 0;
    for (const bg of [...GRAYS, ...NIGHT, ...DAY, WHITE]) {
      const best = Math.max(contrastRatio(glass(bg, alpha), saturate(bg, saturation)), contrastRatio(INK, bg));
      expect(best, `${tone} sobre ${bg.join()}`).toBeGreaterThanOrEqual(3);
    }
    expect(css).toMatch(/\.vidrio--boton \{\s*border: 2px solid var\(--text-on-accent\);/);
  });

  it('respaldo opaco sin backdrop-filter, con transparencia reducida y en alto contraste', () => {
    const blocks = [/@supports not \(\(backdrop-filter[^{]*\{([^}]*)\}/, /prefers-reduced-transparency: reduce\)\s*\{([^}]*)\}/,
      /:root\.high-contrast \.vidrio\s*\{([^}]*)\}/].map((re) => re.exec(css.replace(/\{\s*\.vidrio\s*\{/g, '{'))?.[1] ?? '');
    for (const block of blocks) expect(block).toMatch(/background-color: var\(--bg-accent\);/);
    for (const block of blocks.slice(1)) expect(block).toMatch(/backdrop-filter: none;/);
  });

  it('hover de los botones de vidrio (tres barras, Recentrar): amarillo D100 opaco, texto ≥ 4,5:1 y borde ≥ 3:1 en el mapa', () => {
    const rule = /\.vidrio\.vidrio--boton:hover\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/background-color: var\(--interactive-hover\);/);
    expect(rule).toMatch(/background-image: none;/);
    expect(rule).toMatch(/color: var\(--text-on-hover\);/);
    expect(css.indexOf('.vidrio.vidrio--boton:hover')).toBeGreaterThan(css.indexOf(':root.high-contrast .vidrio')); // también en alto contraste
    const fill = resolveColor('var(--interactive-hover)', tokens);
    expect(contrastRatio(resolveColor('var(--text-on-hover)', tokens), fill)).toBeGreaterThanOrEqual(4.5);
    for (const bg of [...GRAYS, ...NIGHT, ...DAY, WHITE]) {
      expect(Math.max(contrastRatio(fill, bg), contrastRatio(INK, bg)), `sobre ${bg.join()}`).toBeGreaterThanOrEqual(3);
    }
  });
});
