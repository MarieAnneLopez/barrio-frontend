import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { classPairs, MODES, readSrc, THEME, tokenRatio, type Vars } from '../../test/classContrast';
import { resolveColor } from '../../test/colorMath';
import { LanguageSwitcher } from './LanguageSwitcher';

// PAL-02: el header redefine tokens (site-header.css), así que lo que va dentro (la barra desde
// 640 px y el menú del celular) se mide con esos tokens y no solo con los de :root, en los dos tonos
// del header y en los dos modos. Las reglas que aplican se toman en el orden del archivo.
const css = readSrc('components', 'layout', 'site-header.css').replace(/\/\*[\s\S]*?\*\//g, '');
const RULES = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .map(([, selector = '', body = '']) => ({ selector: selector.trim(), body }))
  .filter(({ selector, body }) => selector.includes('.site-header[data-tone') && body.includes('--'));
const HEADER_FILES = ['Header.tsx', 'HeaderTools.tsx', 'LanguageSwitcher.tsx', 'SiteMenu.tsx', 'MenuLink.tsx']
  .map((file) => readSrc('components', 'layout', file)).concat(readSrc('features', 'auth', 'AccountButton.tsx'));
// Fondo de la barra y del menú: rosa con degradado a rosa claro (noche) o crema (papel).
const BACKGROUNDS = { noche: ['--bg-strong', '--bg-accent'], papel: ['--bg-primary'] } as const;
type Tone = keyof typeof BACKGROUNDS;

const rgb = ([r, g, b, a]: number[]) => `rgb(${[r, g, b].map((v) => Math.round(v ?? 0)).join(' ')} / ${a ?? 1})`;

function headerVars(vars: Vars, high: boolean, tone: Tone): Vars {
  const scoped = new Map(vars);
  for (const { selector, body } of RULES) {
    const not = selector.includes(':not(.high-contrast)');
    if ((not && high) || (!not && selector.includes('.high-contrast') && !high)) continue;
    const only = /data-tone='(\w+)'/.exec(selector)?.[1];
    if (only && only !== tone) continue;
    for (const [, name = '', value = ''] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      scoped.set(name, rgb(resolveColor(value, vars))); // var() se resuelve en el header, con los de :root
    }
  }
  return scoped;
}

const CASES = MODES.flatMap(([mode, vars]) => (['noche', 'papel'] as const).map((tone) => {
  const high = mode !== 'estándar';
  return [`${mode}, tono ${tone}`, headerVars(vars, high, tone), tone] as const;
}));

describe.each(CASES)('dentro del header (%s)', (_name, vars, tone) => {
  it('lee de verdad las reglas del header', () => {
    expect(RULES.length).toBeGreaterThanOrEqual(2);
  });

  it('un fondo y un texto en la misma cadena de clases pasan 4,5:1 (el idioma activo también)', () => {
    const failures: string[] = [];
    for (const source of HEADER_FILES) {
      for (const chunk of source.split(/['"`]|\$\{|\}/)) {
        for (const { bg, text } of classPairs(chunk)) {
          const ratio = tokenRatio(THEME.get(text) ?? '', THEME.get(bg) ?? '', vars);
          if (ratio < 4.5) failures.push(`bg-${bg} + text-${text} = ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('el idioma activo se marca con una línea que no depende del color (≥ 3:1 sobre la barra)', () => {
    render(<LanguageSwitcher />);
    const active = screen.getByRole('button', { pressed: true });
    expect(active).toHaveClass('border', 'border-fg');
    for (const off of screen.getAllByRole('button', { pressed: false })) expect(off).toHaveClass('border-transparent');
    for (const bg of BACKGROUNDS[tone]) {
      expect(tokenRatio(THEME.get('fg') ?? '', `var(${bg})`, vars)).toBeGreaterThanOrEqual(3);
    }
  });
});
