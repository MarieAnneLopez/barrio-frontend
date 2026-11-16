import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classPairs, isOpaque, MODES, readSrc, srcDir, THEME, tintedRatio, tokenRatio } from '../test/classContrast';

// tokens.test.ts mide pares de tokens; aquí se mide lo que los componentes juntan de verdad.
// Límite conocido: solo ve un fondo y un texto escritos en la misma cadena de clases (o en la
// misma regla CSS); un texto dentro de otro elemento se prueba en su componente (ver Input.test).
const uiCss = readSrc('components', 'ui', 'ui.css').replace(/\/\*[\s\S]*?\*\//g, '');
// Texto de los botones «ghost» y la superficie donde viven (encabezado, menú, barra de accesibilidad, fichas).
const GHOST = [['--text-primary', '--bg-primary'], ['--text-secondary', '--bg-primary'], ['--text-on-soft', '--bg-soft'], ['--accent-soft', '--bg-surface']];
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
        for (const { bg, text } of classPairs(chunk)) {
          seen += 1;
          const ratio = tokenRatio(THEME.get(text) ?? '', THEME.get(bg) ?? '', vars);
          if (ratio < 4.5) failures.push(`${file}: bg-${bg} + text-${text} = ${ratio.toFixed(2)}:1`);
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

  it('el hover «ghost» se tiñe con el color del propio texto, así que nunca lo iguala (≥ 4,5:1)', () => {
    const body = /\.ui-btn--ghost:hover\s*\{([^}]*)\}/.exec(uiCss)?.[1] ?? '';
    const percent = Number(/background-color:\s*color-mix\(in srgb,\s*currentColor\s+(\d+)%,\s*transparent\)/.exec(body)?.[1]);
    expect(percent).toBeGreaterThan(0);
    for (const [text = '', bg = ''] of GHOST) {
      expect(tintedRatio(`var(${text})`, `var(${bg})`, percent, vars), `${text} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
