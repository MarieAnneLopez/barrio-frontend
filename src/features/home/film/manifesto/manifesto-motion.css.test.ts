import { describe, expect, it } from 'vitest';
import { readSheets } from './cssRules';

// Máscaras, estados y respaldo de movimiento reducido (docs/superpowers/specs, §6, cap. 1).
const { css, rule, media } = readSheets('manifesto.css', 'manifesto-title.css', 'manifesto-motion.css');
const ALLOWED = /^(bg-primary|bg-accent|text-primary|text-on-accent|text-highlight|border-(ink|subtle|strong)|ff-(display|serif|body)|r-sm|step--?\d)$/;

describe('hoja del manifiesto: máscaras y estados', () => {
  it('cada palabra va en una máscara con 0,02em a los lados y 0,08em abajo, más el aire que pide el rebote', () => {
    const mask = rule('.manifesto__mask');
    expect(mask).toContain('overflow: hidden;');
    expect(mask).toContain('padding: var(--bounce-up) 0.02em 0.08em calc(0.02em + var(--bounce-back));');
    // Los márgenes negativos deshacen el padding: la máscara no mueve el texto ni separa las líneas.
    expect(mask).toContain('margin: calc(-1 * var(--bounce-up)) calc(-0.02em - var(--track)) -0.08em calc(-0.02em - var(--bounce-back));');
    // En el rebote la palabra retrocede un 4,33 % de su ancho (0,15em en «RECONOCE») y su esquina derecha sube un pelo.
    for (const text of ['--bounce-back: 0.2em;', '--bounce-up: 0.02em;']) expect(rule('.manifesto__title')).toContain(text);
  });

  it('la palabra se transforma desde arriba a la izquierda y el punto final se despega de la letra', () => {
    expect(rule('.manifesto__word')).toContain('transform-origin: 0 0;');
    expect(rule('.manifesto__mark')).toMatch(/margin-left: 0\.0\d+em;/);
  });

  it('antes de animar las palabras esperan invisibles y el papel, cerrado; el rAF escribe encima', () => {
    expect(rule('.manifesto:not([data-done]) .manifesto__word')).toContain('opacity: 0;');
    expect(rule('.manifesto:not([data-done]) .manifesto__layer--papel')).toContain('clip-path: ellipse(20% 0% at 100% 100%);');
  });

  it.each([
    ['el sistema', (selector: string) => rule(selector, media('prefers-reduced-motion: reduce'))],
    ['la barra de accesibilidad', (selector: string) => rule(`:root.reduce-motion ${selector}`)],
  ])('si %s pide movimiento reducido, la hoja fuerza el estado final', (_who, find) => {
    const word = find('.manifesto .manifesto__word');
    expect(word).toContain('opacity: 1 !important;');
    expect(word).toContain('transform: none !important;');
    expect(find('.manifesto .manifesto__layer--papel')).toContain('clip-path: none !important;');
  });

  it('solo tokens semánticos: sin colores fijos, sombras, transiciones ni animaciones CSS', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|\b(rgb|hsl)a?\(|var\(--(c|palette)-/i);
    expect(css).not.toMatch(/box-shadow|transition|animation|@keyframes/);
    const own = new Set([...css.matchAll(/(?:^|[\s;{])--([\w-]+):/g)].map((match) => match[1]));
    const borrowed = [...css.matchAll(/var\(--([\w-]+)/g)].map((match) => match[1] ?? '').filter((name) => !own.has(name));
    expect(borrowed.length).toBeGreaterThan(4);
    expect(borrowed.filter((name) => !ALLOWED.test(name))).toEqual([]);
  });
});
