import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Vitest va con `css: false`: las hojas se leen del disco.
const here = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => readFileSync(join(here, name), 'utf8');
const SHEETS = ['reel.css', 'reel-title.css', 'reel-grid.css', 'reel-tile.css'] as const;
const [reel, title, grid, tile] = SHEETS.map((name) => read(name).replace(/\/\*[\s\S]*?\*\//g, '')) as [string, string, string, string];
/** Cuerpo de la primera regla cuyo selector es exactamente `selector`. */
const rule = (css: string, selector: string) =>
  new RegExp(`(?:^|})\\s*${selector.replace(/[.[\]:'=()]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

describe('escenario del reel', () => {
  it('la sección mide 300svh: una pantalla sticky de 100svh y 200svh de recorrido', () => {
    expect(rule(reel, '.reel')).toMatch(/height: 300svh;/);
    const stage = rule(reel, '.reel-stage');
    for (const declaration of ['position: sticky;', 'top: 0;', 'height: 100svh;']) expect(stage).toContain(declaration);
  });

  it('deja libres los 64 px del header y no desborda a lo ancho', () => {
    expect(rule(reel, '.reel-stage')).toMatch(/padding-top: 4rem;/);
    expect(rule(reel, '.reel-stage')).toMatch(/overflow: clip;/);
    expect(rule(reel, '.reel-frame')).toMatch(/inset: 4rem 0 0;/);
  });

  it('fondo crema con grano de puntos de 6 px (D96)', () => {
    const stage = rule(reel, '.reel-stage');
    expect(stage).toMatch(/background-color: var\(--bg-primary\);/);
    expect(stage).toMatch(/background-image: radial-gradient\(/);
    expect(stage).toMatch(/background-size: 6px 6px;/);
  });

  it('titular en la display (Anton, peso 400) y pista en la tipografía de interfaz', () => {
    expect(rule(title, '.reel-title')).toMatch(/font-family: var\(--ff-display\);/);
    expect(rule(title, '.reel-title')).toMatch(/font-weight: 400;/);
    expect(rule(reel, '.reel-hint')).toMatch(/font-family: var\(--ff-body\);/);
    expect(rule(reel, '.reel-hint')).toMatch(/pointer-events: none;/);
  });

  it('en pantallas estrechas la pista sube por encima del chat y de WhatsApp (72 px desde abajo)', () => {
    const narrow = /@media \(max-width: 639px\) \{\s*\.reel-hint \{\s*bottom: ([\d.]+)rem;\s*\}\s*\}/.exec(reel)?.[1];
    expect(Number(narrow) * 16).toBeGreaterThanOrEqual(80);
  });

  it('el lienzo deja el scroll vertical al navegador y muestra el foco por dentro', () => {
    expect(rule(reel, '.reel-frame')).toMatch(/touch-action: pan-y;/);
    expect(rule(reel, '.reel-frame:focus-visible')).toMatch(/outline: 2px solid var\(--focus-ring\);/);
    expect(rule(reel, '.reel-frame:focus-visible')).toMatch(/outline-offset: -\d+px;/);
  });

  it('sin recorrido con movimiento reducido (sistema o barra de accesibilidad) ni en la rejilla definitiva', () => {
    const media = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(reel)?.[1] ?? '';
    for (const css of [media, reel.replace(media, '')]) {
      const prefix = css === media ? '' : ':root.reduce-motion ';
      expect(rule(css, `${prefix}.reel`)).toMatch(/height: auto;/);
      expect(rule(css, `${prefix}.reel-stage`)).toMatch(/position: relative;/);
    }
    expect(rule(grid, ".reel[data-mode='grid']")).toMatch(/height: auto;/);
    expect(rule(grid, ".reel[data-mode='grid'] .reel-stage")).toMatch(/position: relative;/);
  });

  it('mientras llega el motor la sección ya mide lo que el reel: el cambio no mueve la página', () => {
    expect(`${reel}${grid}`).not.toMatch(/data-mode='pending'\][^{,]*\{[^}]*(height|position|padding)/);
    expect(rule(grid, ".reel:not([data-mode='reel']) .reel-stage")).not.toMatch(/height|position/);
    expect(rule(reel, ".reel[data-mode='pending'] .reel-frame")).toMatch(/visibility: hidden;/); // no tapa los enlaces
    expect(rule(grid, '.reel-grid__list')).toMatch(/grid-auto-rows: minmax\(2\.75rem, 1fr\);/); // cabe en una pantalla
  });
});

describe('reglas del sistema de diseño en las hojas del reel', () => {
  it.each(SHEETS.map((name, at) => [name, [reel, title, grid, tile][at] ?? '']))('%s: solo tokens semánticos, radio de 4 px y sin sombras', (_name, css) => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/rgba?\(|hsla?\(/);
    expect(css).not.toMatch(/var\(--c-/);
    expect(css).not.toMatch(/box-shadow: (?!inset 0 0 0 \d+px var\(--focus-ring-inner\))/);
    for (const [, radius] of css.matchAll(/border-radius: ([^;]+);/g)) expect(radius).toBe('var(--r-sm)');
    expect(css).not.toMatch(/@keyframes|animation:/); // solo se animan transform y opacity (y aquí, nada)
    for (const [, value] of css.matchAll(/transition: ([^;]+);/g)) expect(value).toMatch(/^(transform|opacity)\b/);
  });

  it('el código del reel no escribe colores sueltos ni cancela la rueda o el toque, ni bloquea el body', () => {
    const sources = readdirSync(here).filter((name) => /\.tsx?$/.test(name) && !/\.test\.|Kit\.ts$|Harness/.test(name));
    expect(sources.length).toBeGreaterThan(12);
    for (const file of sources) {
      const text = read(file);
      expect(text, file).not.toMatch(/#[0-9a-f]{6}\b|\b0x[0-9a-f]{6}\b|rgba?\(/i);
      expect(text, file).not.toMatch(/document\.body|overflow\s*=/);
      if (file !== 'useModuleReel.ts') expect(text, file).not.toMatch(/preventDefault/); // solo teclas
    }
    expect(read('reelPointer.ts')).toMatch(/'wheel', \w+, \{ passive: true \}/);
  });
});
