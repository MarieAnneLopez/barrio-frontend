import { describe, expect, it } from 'vitest';
import { MODES, readSrc, tokenRatio } from '../test/classContrast';

// Tonos (etapa 2): una superficie papel reescopa los tokens de texto y de línea, y una superficie
// noche dentro de ella los devuelve al valor de la raíz. Así un componente se lee sobre los dos fondos.
const css = readSrc('styles', 'tone.css').replace(/\/\*[\s\S]*?\*\//g, '');
const block = (selector: string) => new RegExp(`${selector.replace('.', '\\.')} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';
const TEXT = ['text-primary', 'text-secondary', 'text-muted', 'text-highlight', 'accent-soft'];
const LINES = ['border-subtle', 'border-strong'];

describe('tonos de superficie', () => {
  it('.tone-papel pone noche en todo el texto (el ámbar nunca es texto sobre papel) y acero en las líneas', () => {
    const papel = block('.tone-papel');
    for (const token of TEXT) expect(papel).toContain(`--${token}: var(--text-on-accent);`);
    for (const token of LINES) expect(papel).toContain(`--${token}: var(--border-ink);`);
    expect(papel).toContain('color: var(--text-primary);');
  });

  it.each(MODES)('en modo %s, el texto y las líneas de .tone-papel se distinguen sobre papel', (_mode, vars) => {
    expect(tokenRatio('var(--text-on-accent)', 'var(--bg-accent)', vars)).toBeGreaterThanOrEqual(4.5);
    expect(tokenRatio('var(--border-ink)', 'var(--bg-accent)', vars)).toBeGreaterThanOrEqual(3);
  });

  it('.tone-noche devuelve cada token a su valor de la raíz', () => {
    const [root, noche] = [block(':root'), /\.tone-noche,[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? ''];
    for (const token of [...TEXT, ...LINES, 'skeleton-base', 'skeleton-shine']) {
      expect(root).toContain(`--noche-${token}: var(--${token});`);
      expect(noche).toContain(`--${token}: var(--noche-${token});`);
    }
    expect(noche).toContain('color: var(--text-primary);');
    // También sin la clase: una tarjeta o un panel noche dentro de un tono papel.
    expect(css).toContain('.tone-papel :is(.ui-card:not(.ui-card--paper), .ui-panel, .bg-surface, .bg-bg, .bg-glass)');
  });

  it('los esqueletos de carga se tiñen con el texto de la superficie papel', () => {
    expect(block('.tone-papel')).toMatch(/--skeleton-base: color-mix\(in srgb, var\(--text-on-accent\) \d+%, transparent\);/);
  });
});
