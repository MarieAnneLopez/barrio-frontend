import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, over, parseVars, resolveColor } from '../test/colorMath';
import { colorsIn } from '../test/paletteScan';

// Lectura directa: con `css: false`, Vitest entrega los .css?raw vacíos.
const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..');
function sources(ext: string): [string, string][] {
  const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' });
  return files
    .filter((f) => f.endsWith(ext))
    .map((f) => [f, readFileSync(join(srcDir, f), 'utf8')]);
}
const tokensCss = readFileSync(join(srcDir, 'styles', 'tokens.css'), 'utf8');
const contrastCss = readFileSync(join(srcDir, 'styles', 'contrast.css'), 'utf8');

const ALLOWED = new Set([
  'fcf0cf', 'f3d1dc', 'f6a7c1', 'fdcf76', 'b16e4b', // paleta D100: crema, rosa claro, rosa, amarillo, marrón
  'ffffff', '000000', // texto negro y alto contraste
  '166534', '9a3412', '991b1b', // estados semánticos sobre crema
  '86efac', 'fdba74', 'fca5a5', // estados semánticos en alto contraste (sobre negro)
]);

describe('paleta estricta (D100)', () => {
  it('lee de verdad los estilos', () => {
    expect(sources('.css').length).toBeGreaterThanOrEqual(4);
    expect(tokensCss).toContain('--bg-primary');
  });

  it('los CSS solo usan colores de la paleta (sin violeta; el tema de los mapas va aparte)', () => {
    for (const [file, text] of sources('.css').filter(([f]) => !f.endsWith('map-palette.css'))) {
      // Hex de 3 a 8 cifras, rgb(), funciones de color y nombres de color (src/test/paletteScan.ts).
      for (const color of colorsIn(text)) expect(ALLOWED.has(color), `${file}: ${color}`).toBe(true);
    }
  });

  it('los componentes no escriben hex sueltos: usan tokens', () => {
    for (const [file, text] of sources('.tsx').filter(([f]) => !f.includes('.test.'))) {
      expect(text.match(/#[0-9a-f]{3,8}\b/gi), file).toBeNull();
    }
  });
});

const base = parseVars(tokensCss, ':root');
const high = new Map([...base, ...parseVars(contrastCss, ':root.high-contrast')]);

const TEXT_PAIRS: [string, string][] = [
  ['--text-primary', '--bg-primary'], ['--text-primary', '--bg-surface'], ['--text-primary', '--bg-nav'],
  ['--text-secondary', '--bg-primary'], ['--text-secondary', '--bg-surface'],
  ['--text-muted', '--bg-primary'], ['--text-muted', '--bg-surface'],
  ['--text-on-accent', '--bg-accent'], ['--text-on-soft', '--bg-soft'],
  ['--text-on-hover', '--interactive-hover'], ['--text-on-active', '--interactive-active'],
  ['--text-on-highlight', '--interactive-secondary'], ['--text-on-highlight', '--bg-highlight'],
  ['--text-highlight', '--bg-surface'],
  ['--accent-soft', '--bg-primary'], ['--accent-soft', '--bg-surface'],
  ['--state-success', '--bg-surface'], ['--state-warning', '--bg-surface'], ['--state-error', '--bg-surface'],
  ['--text-on-accent', '--bg-highlight'], ['--text-on-accent', '--bg-strong'], // D100
];
// Texto grande (≥ 24 px, o ≥ 18,66 px en negrita): le basta 3:1. CTA, pie marrón y títulos marrón.
const LARGE_PAIRS: [string, string][] = [
  ['--text-on-interactive', '--interactive-primary'], ['--text-on-band', '--bg-band'], ['--text-title', '--bg-primary'],
];

describe.each([
  ['estándar', base],
  ['alto contraste', high],
])('contraste WCAG AA en modo %s', (_mode, vars) => {
  it.each(TEXT_PAIRS)('%s sobre %s ≥ 4.5:1', (fgVar, bgVar) => {
    const bg = resolveColor(`var(${bgVar})`, vars);
    const opaqueBg = bg[3] < 1 ? over(bg, resolveColor('var(--bg-primary)', vars)) : bg;
    const fg = over(resolveColor(`var(${fgVar})`, vars), opaqueBg);
    expect(contrastRatio(fg, opaqueBg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(LARGE_PAIRS)('texto grande: %s sobre %s ≥ 3:1', (fgVar, bgVar) => {
    expect(contrastRatio(resolveColor(`var(${fgVar})`, vars), resolveColor(`var(${bgVar})`, vars))).toBeGreaterThanOrEqual(3);
  });

  it.each(['--bg-primary', '--bg-accent', '--interactive-primary'])(
    'el anillo de foco doble se distingue sobre %s (≥ 3:1)', (bgVar) => {
      const bg = resolveColor(`var(${bgVar})`, vars);
      const best = Math.max(...['--focus-ring', '--focus-ring-inner'].map(
        (ring) => contrastRatio(resolveColor(`var(${ring})`, vars), bg)));
      expect(best).toBeGreaterThanOrEqual(3);
    });
});
