import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classPairs, isOpaque, MODES, readSrc, srcDir, THEME, tokenRatio } from '../test/classContrast';

// tokens.test.ts mide pares de tokens; aquí se mide lo que los componentes juntan de verdad.
// Límite conocido: solo ve un fondo y un texto escritos en la misma cadena de clases (o en la
// misma regla CSS); un texto dentro de otro elemento se prueba en su componente (ver Input.test).
const uiCss = readSrc('components', 'ui', 'ui.css').replace(/\/\*[\s\S]*?\*\//g, '');
// El CTA (ui-btn--primary) lleva texto crema sobre marrón, 3,56:1: ui.css lo fuerza a 19 px en
// negrita, así que cuenta como texto grande y le basta 3:1 (WCAG 1.4.3).
const CTA = /\bui-btn--primary\b/;
const cta = (/\.ui-btn--primary\s*\{([^}]*)\}/.exec(uiCss)?.[1] ?? '');
const components = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.tsx') && !file.includes('.test.'));

describe('classPairs', () => {
  it('saca el par base y el de cada variante, que hereda lo que no redefine', () => {
    expect(classPairs('px-4 bg-interactive text-on-interactive text-step-1')).toEqual([{ bg: 'interactive', text: 'on-interactive' }]);
    expect(classPairs('bg-surface text-fg hover:bg-interactive')).toEqual([
      { bg: 'surface', text: 'fg' },
      { bg: 'interactive', text: 'fg' },
    ]);
    expect(classPairs('bg-transparent text-left text-fg')).toEqual([]);
  });
});

describe.each(MODES)('lo que los componentes combinan, en modo %s (D84)', (_mode, vars) => {
  it('un fondo y un texto en la misma cadena de clases pasan 4,5:1', () => {
    const failures: string[] = [];
    let seen = 0;
    for (const file of components) {
      for (const chunk of readSrc(file).split(/['"`]|\$\{|\}/)) {
        const minimum = CTA.test(chunk) ? 3 : 4.5;
        for (const { bg, text } of classPairs(chunk)) {
          seen += 1;
          const ratio = tokenRatio(THEME.get(text) ?? '', THEME.get(bg) ?? '', vars);
          if (ratio < minimum) failures.push(`${file}: bg-${bg} + text-${text} = ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(seen).toBeGreaterThan(20);
    expect(failures).toEqual([]);
  });

  it('un hover de ui.css que pone un fondo opaco fija también el texto, y el par pasa 4,5:1', () => {
    const failures: string[] = [];
    let seen = 0;
    for (const [, selector = '', body = ''] of uiCss.matchAll(/([^{}]*:hover[^{}]*)\{([^}]*)\}/g)) {
      const bg = /background-color:\s*(var\(--[\w-]+\))/.exec(body)?.[1];
      if (!bg || !isOpaque(bg)) continue;
      seen += 1;
      const text = /(?:^|[\s;])color:\s*(var\(--[\w-]+\))/.exec(body)?.[1];
      const rule = selector.trim().replace(/\s+/g, ' ');
      if (!text) failures.push(`${rule}: cambia el fondo a ${bg} sin fijar el texto`);
      else if (tokenRatio(text, bg, vars) < 4.5) failures.push(`${rule}: ${text} sobre ${bg} = ${tokenRatio(text, bg, vars).toFixed(2)}:1`);
    }
    expect(seen).toBeGreaterThanOrEqual(2);
    expect(failures).toEqual([]);
  });

  it('el hover «ghost» pone el amarillo con su texto negro, como los demás (≥ 4,5:1)', () => {
    const body = /\.ui-btn--ghost:hover\s*\{([^}]*)\}/.exec(uiCss)?.[1] ?? '';
    expect(body).toContain('background-color: var(--interactive-hover);');
    expect(body).toContain('color: var(--text-on-hover);');
    expect(tokenRatio('var(--text-on-hover)', 'var(--interactive-hover)', vars)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('el CTA es texto grande de verdad (D100)', () => {
  it('ui.css fuerza 19 px (≥ 18,66) en Inter 700 a todo ui-btn--primary (en px reales: largeText.test)', () => {
    expect(cta).toContain('font-size: max(1.1875rem, 19px);');
    expect(cta).toContain('font-weight: 700;');
    expect(cta).toContain('font-family: var(--ff-heading);');
  });
});
