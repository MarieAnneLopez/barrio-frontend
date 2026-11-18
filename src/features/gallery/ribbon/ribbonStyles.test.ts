import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Vitest va con `css: false`: las hojas se leen del disco.
const here = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => readFileSync(join(here, name), 'utf8');
const SHEETS = ['ribbon.css', 'ribbon-grid.css', 'ribbon-caption.css'] as const;
const sheets = SHEETS.map((name) => read(name).replace(/\/\*[\s\S]*?\*\//g, ''));
const [ribbon = '', grid = ''] = sheets;
/** Cuerpo de la primera regla cuyo selector es exactamente `selector`. */
const rule = (css: string, selector: string) =>
  new RegExp(`(?:^|})\\s*${selector.replace(/[.[\]:'=()]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

describe('escenario de la cinta', () => {
  it('crema, con su línea de 1 px, alto fijo y sin desborde: la rejilla de espera mide lo mismo', () => {
    const stage = rule(ribbon, '.ribbon-stage');
    for (const declaration of ['position: relative;', 'overflow: clip;', 'background-color: var(--bg-primary);', 'border-radius: var(--r-sm);']) {
      expect(stage).toContain(declaration);
    }
    expect(stage).toMatch(/height: clamp\(/);
    expect(rule(grid, ".ribbon[data-mode='pending'] .ribbon-grid")).toMatch(/overflow-y: auto;/);
    expect(rule(grid, ".ribbon[data-mode='grid'] .ribbon-stage")).toMatch(/height: auto;/);
  });

  it('el escenario aísla su apilamiento: los botones de las fotos nunca tapan el visor, el menú ni lo fijo', () => {
    expect(rule(ribbon, '.ribbon-stage')).toContain('isolation: isolate;');
  });

  it('el lienzo deja el scroll vertical al navegador y, mientras llega el motor, no tapa la rejilla', () => {
    expect(rule(ribbon, '.ribbon-frame')).toMatch(/touch-action: pan-y;/);
    expect(rule(ribbon, ".ribbon[data-mode='pending'] .ribbon-frame")).toMatch(/visibility: hidden;/);
  });

  it('los botones son transparentes; su foco lo pinta el shader (el recorte cortaría el anillo del CSS)', () => {
    expect(rule(ribbon, '.ribbon-hit')).toMatch(/background-color: transparent;/);
    expect(rule(ribbon, '.ribbon-hit:focus-visible')).toMatch(/outline: none;/);
    expect(`${ribbon}${grid}`.match(/outline: none/g)).toHaveLength(1);
    expect(grid).toMatch(/\.ribbon-tile:focus-visible \.ribbon-tile__label\s*\{[^}]*text-decoration: underline;/);
  });

  it.each(SHEETS.map((name, at) => [name, sheets[at] ?? '']))('%s: solo tokens, radio de 4 px, sin sombras ni animaciones', (_name, css) => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/rgba?\(|hsla?\(/);
    expect(css).not.toMatch(/var\(--c-/);
    expect(css).not.toMatch(/box-shadow: (?!none)/);
    for (const [, radius] of css.matchAll(/border-radius: ([^;]+);/g)) expect(radius).toBe('var(--r-sm)');
    expect(css).not.toMatch(/@keyframes|animation:|transition:/);
  });
});

describe('reglas del código de la cinta', () => {
  const sources = readdirSync(here).filter((name) => /\.tsx?$/.test(name) && !/\.test\.|Kit\.ts$|Harness/.test(name));

  it('sin colores sueltos, sin tocar el body y sin cancelar la rueda ni el toque', () => {
    expect(sources.length).toBeGreaterThan(20);
    for (const file of sources) {
      const text = read(file);
      expect(text, file).not.toMatch(/#[0-9a-f]{6}\b|\b0x[0-9a-f]{6}\b|rgba?\(/i);
      expect(text, file).not.toMatch(/document\.body|overflow\s*=/);
      // Solo se cancelan las teclas que usa la cinta y el clic sintético de un arrastre.
      if (!['useRibbon.ts', 'ribbonPointer.ts'].includes(file)) expect(text, file).not.toMatch(/preventDefault/);
    }
    expect(read('ribbonInput.ts')).toMatch(/'wheel', wheel, \{ passive: true \}/);
  });

  it('three directo, sin react-three-fiber', () => {
    for (const file of sources) expect(read(file), file).not.toMatch(/@react-three\//);
  });
});
