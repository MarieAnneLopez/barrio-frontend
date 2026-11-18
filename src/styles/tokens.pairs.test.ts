import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseVars, resolveColor } from '../test/colorMath';

// Pares medidos a mano por Martín (D100), reverificados contra tokens.css.
const tokensCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tokens.css'), 'utf8');
const base = parseVars(tokensCss, ':root');
const ratio = (fg: string, bg: string) =>
  contrastRatio(resolveColor(`var(--c-${fg})`, base), resolveColor(`var(--c-${bg})`, base));

describe('pares medidos de la paleta D100 (calculados por Martín y reverificados aquí)', () => {
  it.each([
    ['negro', 'crema', 18.5], ['negro', 'rosa-claro', 14.96], ['negro', 'rosa', 11.22],
    ['negro', 'amarillo', 14.36], ['negro', 'marron', 5.2], ['marron', 'crema', 3.56],
    ['marron', 'rosa-claro', 2.88], ['marron', 'amarillo', 2.76], ['marron', 'rosa', 2.16], ['crema', 'marron', 3.56],
  ] as const)('%s sobre %s = %f', (fg, bg, expected) => {
    expect(Math.abs(ratio(fg, bg) - expected)).toBeLessThanOrEqual(0.02);
  });

  it('el marrón solo vale como texto grande (≥ 3:1) y nunca como texto normal sobre crema', () => {
    expect(ratio('marron', 'crema')).toBeGreaterThanOrEqual(3);
    expect(ratio('marron', 'crema')).toBeLessThan(4.5);
  });

  it('por eso el marrón nunca es texto sobre rosa claro, rosa ni amarillo: ni como grande llega a 3:1', () => {
    for (const bg of ['rosa-claro', 'rosa', 'amarillo'] as const) expect(ratio('marron', bg)).toBeLessThan(3);
  });

  it('el cuerpo sale de --texto-cuerpo, negro, para cambiarlo en una línea ([PROPUESTA])', () => {
    expect(base.get('--texto-cuerpo')).toBe('var(--c-negro)');
    expect(base.get('--text-primary')).toBe('var(--texto-cuerpo)');
  });

  it('blanco sobre marrón: 4,04, solo texto grande', () => {
    expect(contrastRatio(resolveColor('#ffffff', base), resolveColor('var(--c-marron)', base))).toBeCloseTo(4.04, 1);
  });
});
