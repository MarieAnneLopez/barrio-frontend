import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MODES } from '../../../test/classContrast';
import { contrastRatio, over, resolveColor, type Rgba } from '../../../test/colorMath';
import { colorsIn } from '../../../test/paletteScan';

const read = (file: string) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8');
const runnerCss = read('bar-runner.css');
const barCss = read('loading-bar.css');
const HIGH = ':root.high-contrast ';

/** Cuerpo de la regla cuyo selector es exactamente `selector` (al principio de una línea). */
const rule = (selector: string) =>
  new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(barCss)?.[1] ?? '';
const prop = (body: string, name: string) => new RegExp(`(?:^|\\s)${name}: ([^;]+);`).exec(body)?.[1]?.trim();
/** Color de fondo de una pieza de la barra en un modo: la regla de alto contraste manda si existe. */
const background = (selector: string, high: boolean) =>
  (high ? prop(rule(HIGH + selector), 'background-color') : undefined) ?? prop(rule(selector), 'background-color') ?? '';
/** `color-mix(in srgb, var(--x) N%, transparent)`: ese token con N % de opacidad. */
function mixed(value: string, vars: Map<string, string>): Rgba {
  const [, token = '', amount = '0'] = /color-mix\(in srgb, (var\(--[\w-]+\)) (\d+)%, transparent\)/.exec(value) ?? [];
  const [r, g, b] = resolveColor(token, vars);
  return [r, g, b, Number(amount) / 100];
}

describe('la Mini Marie de la barra, en su sitio', () => {
  // Auditoría MM-06: como la grande, se apoyaba sobre el hueco del interlineado (~9 px más arriba).
  it('de pie sobre la barra: sin hueco de interlineado bajo ella', () => {
    expect(runnerCss).toMatch(/\.bar-runner \{[^}]*line-height: 0;/);
  });

  // Auditoría MM-01: comparte el atlas de la grande (D111) y siempre lo reduce; el vecino más cercano
  // (pixelated, que sequence.css pone a 1× y 2×) le dentaba el contorno al reducir.
  it('reduce el atlas compartido con suavizado, no con el vecino más cercano', () => {
    expect(runnerCss).toMatch(/\.bar-runner \.sequence__strip \{[^}]*image-rendering: auto;/);
  });
});

// Auditoría MM-05 y PAL-12: en Alto Contraste relleno y pista eran los dos #000 (1:1) y el brillo,
// un crema escrito a mano, no seguía el tema.
describe.each(MODES)('barra de carga en modo %s', (mode, vars) => {
  const high = mode === 'alto contraste';
  const color = (selector: string) => resolveColor(background(selector, high), vars);

  it('el relleno se distingue de la pista (≥ 3:1, WCAG 1.4.11)', () => {
    expect(contrastRatio(color('.loading-bar__fill'), color('.loading-bar__track'))).toBeGreaterThanOrEqual(3);
  });

  it('el brillo sale de los tokens del tema, sin colores escritos a mano', () => {
    const shine = prop(rule('.loading-bar__fill::after'), 'background-image') ?? '';
    expect(colorsIn(`background-image: ${shine};`)).toEqual([]);
    expect(shine).toMatch(/var\(--[\w-]+\)/);
    if (high) { // y en alto contraste, donde pasa el brillo, el relleno sigue a ≥ 3:1 de la pista
      const lit = over(mixed(shine, vars), color('.loading-bar__fill'));
      expect(contrastRatio(lit, color('.loading-bar__track'))).toBeGreaterThanOrEqual(3);
    }
  });

  it.runIf(high)('las chispas se ven sobre el fondo de la pantalla', () => {
    expect(contrastRatio(color('.loading-bar__spark'), resolveColor('var(--bg-primary)', vars))).toBeGreaterThanOrEqual(3);
  });
});
