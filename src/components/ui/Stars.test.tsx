import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MODES, readSrc, type Vars } from '../../test/classContrast';
import { contrastRatio, parseVars, resolveColor } from '../../test/colorMath';
import { starColors } from '../../test/starColors';
import { Stars } from './Stars';
import { StarsInput } from './StarsInput';

// PAL-09 (revisión): dentro de una superficie rosa claro (.tone-papel) la línea fuerte y el realce
// valen negro, así que llenas y vacías tendrían el mismo contorno y solo el amarillo las separaría
// (1,04:1 sobre rosa claro). Las estrellas llevan su propia superficie crema (.bg-surface), que allí
// devuelve los tokens de la raíz (tone.css): se miden con los tokens que de verdad les llegan.
const tone = readSrc('styles', 'tone.css').replace(/\/\*[\s\S]*?\*\//g, '');
const RESTORE = /\.tone-papel :is\((.+)\)\s*\{/.exec(tone)?.[1] ?? '';
const PAPEL = parseVars(tone, '.tone-papel');
const rgb = ([r, g, b, a]: number[]) => `rgb(${[r, g, b].map((v) => Math.round(v ?? 0)).join(' ')} / ${a ?? 1})`;

/** Tokens y fondo que le llegan a una estrella dentro de `papel`: los de la raíz si hay una superficie noche. */
function context(icon: Element, papel: Element, vars: Vars): { vars: Vars; bg: string } {
  const surface = icon.closest(RESTORE);
  if (surface && papel.contains(surface)) return { vars, bg: 'var(--bg-surface)' };
  const scoped = new Map(vars);
  // Los de texto y línea (los esqueletos mezclan con transparent y no son de las estrellas).
  for (const [name, value] of PAPEL) if (!name.includes('skeleton')) scoped.set(name, rgb(resolveColor(value, vars)));
  return { vars: scoped, bg: 'var(--bg-accent)' };
}

function drawOnPink() {
  const { container } = render(
    <div className="tone-papel bg-pink" data-testid="papel">
      <Stars value={3.5} label="3,5 de 5 estrellas" />
      <StarsInput legend="Tu calificación" value={2} onChange={() => undefined} />
    </div>,
  );
  const papel = container.querySelector('[data-testid="papel"]') as Element;
  return { papel, icons: [...papel.querySelectorAll('svg.stars-icon')] };
}

describe('estrellas sobre una superficie rosa claro (.tone-papel)', () => {
  it('lee de verdad tone.css', () => {
    expect(RESTORE).toContain('.bg-surface');
    expect(PAPEL.get('--border-strong')).toBe('var(--text-on-accent)');
  });

  describe.each(MODES)('en modo %s', (mode, vars) => {
    const star = starColors(mode !== 'estándar');

    it('el contorno se recorta sobre su fondo y una llena no se confunde con una vacía (≥ 3:1)', () => {
      const { papel, icons } = drawOnPink();
      expect(icons).toHaveLength(10); // 5 de la calificación y 5 del selector
      for (const icon of icons) {
        const { vars: local, bg } = context(icon, papel, vars);
        const color = (value: string) => resolveColor(value, local);
        expect(contrastRatio(color(star.stroke), color(bg))).toBeGreaterThanOrEqual(3);
        expect(contrastRatio(color(star.empty), color(bg))).toBeGreaterThanOrEqual(3);
        const byFill = contrastRatio(color(star.fill), color(bg));
        const byEdge = contrastRatio(color(star.stroke), color(star.empty));
        expect(Math.max(byFill, byEdge), `relleno ${byFill.toFixed(2)} · contorno ${byEdge.toFixed(2)}`).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
