import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, over, parseVars, resolveColor } from '../test/colorMath';

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
  'af50e5', '8a0bd2', 'd980f9', 'e2cef6', '5b0672', // paleta D79
  'ffffff', '000000', // blanco y negro
  '86efac', 'fdba74', 'fca5a5', // estados semánticos (claros, sobre oscuro)
]);
const ALLOWED_RGB = new Set(
  [...ALLOWED].map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')),
);

describe('paleta estricta (D79)', () => {
  it('lee de verdad los estilos', () => {
    expect(sources('.css').length).toBeGreaterThanOrEqual(4);
    expect(tokensCss).toContain('--bg-primary');
  });

  it('los CSS solo usan colores permitidos (sin amarillo fuera del sprite)', () => {
    for (const [file, text] of sources('.css').filter(([f]) => !f.endsWith('map-palette.css'))) { // D82: aparte
      for (const [, hex] of text.matchAll(/#([0-9a-f]{6})\b/gi)) {
        expect(ALLOWED.has((hex ?? '').toLowerCase()), `${file}: #${hex}`).toBe(true);
      }
      for (const [, r, g, b] of text.matchAll(/rgba?\((\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) {
        expect(ALLOWED_RGB.has(`${r} ${g} ${b}`), `${file}: rgb(${r} ${g} ${b})`).toBe(true);
      }
    }
  });

  it('los componentes no escriben hex sueltos: usan tokens', () => {
    for (const [file, text] of sources('.tsx')) {
      expect(text.match(/#[0-9a-f]{6}\b/gi), file).toBeNull();
    }
  });
});

const base = parseVars(tokensCss, ':root');
const high = new Map([...base, ...parseVars(contrastCss, ':root.high-contrast')]);

const TEXT_PAIRS: [string, string][] = [
  ['--text-primary', '--bg-nav'],
  ['--text-primary', '--bg-surface'],
  ['--text-secondary', '--bg-nav'],
  ['--text-secondary', '--bg-surface'],
  ['--text-muted', '--bg-nav'],
  ['--text-muted', '--bg-surface'],
  ['--text-on-interactive', '--interactive-primary'],
  ['--text-on-interactive', '--interactive-hover'],
  ['--text-on-interactive', '--interactive-active'],
  ['--text-on-accent', '--bg-accent'],
  ['--text-on-soft', '--bg-soft'],
  ['--text-highlight', '--bg-surface'],
  ['--accent-soft', '--bg-nav'],
  ['--accent-soft', '--bg-surface'],
  ['--state-success', '--bg-surface'],
  ['--state-warning', '--bg-surface'],
  ['--state-error', '--bg-surface'],
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

  it.each(['--bg-primary', '--bg-surface', '--bg-accent', '--bg-soft', '--bg-nav'])(
    'el anillo de foco doble se distingue sobre %s (≥ 3:1)', (bgVar) => {
      const bg = resolveColor(`var(${bgVar})`, vars);
      const best = Math.max(...['--focus-ring', '--focus-ring-inner'].map(
        (ring) => contrastRatio(resolveColor(`var(${ring})`, vars), bg)));
      expect(best).toBeGreaterThanOrEqual(3);
    });
});

describe('fondo principal (D79): solo texto grande, íconos y bordes', () => {
  it('blanco sobre principal da ≥ 3:1 (texto grande) y < 4,5:1 (prohibido para texto normal)', () => {
    const ratio = contrastRatio(resolveColor('var(--text-primary)', base), resolveColor('var(--bg-primary)', base));
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
  });
});
