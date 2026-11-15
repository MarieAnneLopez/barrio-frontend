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
  'b44446', '64242f', 'fc8f8f', 'dfd9d8', // paleta v2 «Ladrillo y píxel» (D68)
  'ffffff', '000000', // blanco y negro
  '86efac', 'fdba74', 'fca5a5', // estados semánticos (claros, sobre vino)
]);
const ALLOWED_RGB = new Set(
  [...ALLOWED].map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')),
);

describe('paleta estricta (v2, D68)', () => {
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
  ['--text-on-interactive', '--interactive-active'],
  ['--text-on-accent', '--bg-accent'],
  ['--text-on-soft', '--bg-soft'],
  ['--text-highlight', '--bg-surface'],
  ['--accent-soft', '--bg-primary'],
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

  it.each(['--bg-primary', '--bg-surface', '--bg-accent', '--bg-soft'])(
    'el anillo de foco doble se distingue sobre %s (≥ 3:1)', (bgVar) => {
      const bg = resolveColor(`var(${bgVar})`, vars);
      const best = Math.max(...['--focus-ring', '--focus-ring-inner'].map(
        (ring) => contrastRatio(resolveColor(`var(${ring})`, vars), bg)));
      expect(best).toBeGreaterThanOrEqual(3);
    });
});
