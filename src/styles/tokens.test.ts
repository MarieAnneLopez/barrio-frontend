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
  '0b131e', '0b1e38', '8ab4f8', '1d4ed8', '3b82f6', // paleta oficial
  'ffffff', '000000', // blanco y negro
  '34d399', 'fbbf24', 'f87171', // estados semánticos
]);
const ALLOWED_RGB = new Set(
  [...ALLOWED].map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')),
);

describe('paleta estricta', () => {
  it('lee de verdad los estilos', () => {
    expect(sources('.css').length).toBeGreaterThanOrEqual(4);
    expect(tokensCss).toContain('--bg-primary');
  });

  it('los CSS solo usan colores permitidos (sin amarillo fuera del sprite)', () => {
    for (const [file, text] of sources('.css')) {
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
  ['--text-primary', '--bg-primary'],
  ['--text-primary', '--bg-surface'],
  ['--text-secondary', '--bg-primary'],
  ['--text-secondary', '--bg-surface'],
  ['--text-muted', '--bg-primary'],
  ['--text-muted', '--bg-surface'],
  ['--text-on-interactive', '--interactive-primary'],
  ['--text-on-interactive', '--interactive-hover'],
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

  it('el anillo de foco se distingue del fondo (≥ 3:1)', () => {
    const ring = resolveColor('var(--focus-ring)', vars);
    expect(contrastRatio(ring, resolveColor('var(--bg-primary)', vars))).toBeGreaterThanOrEqual(3);
  });
});
