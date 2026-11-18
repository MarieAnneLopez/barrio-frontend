import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// D98: el texto que no es título va en Soria (By Dani, SIL OFL 1.1), servida en local.
const here = dirname(fileURLToPath(import.meta.url));
const read = (...parts: string[]) => readFileSync(join(here, ...parts), 'utf8');
const fontDir = join(here, '..', '..', 'public', 'assets', 'fonts', 'soria');
const soria = read('soria.css');
const scale = read('scale.css');
const type = read('type.css');

describe('Soria para el texto que no es título (D98)', () => {
  it('se sirve en local con su licencia OFL, sin red', () => {
    expect(existsSync(join(fontDir, 'soria.ttf'))).toBe(true);
    expect(readFileSync(join(fontDir, 'OFL.txt'), 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(soria).toMatch(/@font-face \{[^}]*font-family: 'Soria';[^}]*url\('\/assets\/fonts\/soria\/soria\.ttf'\)/);
    expect(soria).toMatch(/font-display: swap;/);
    expect(soria).not.toMatch(/https?:\/\//);
    expect(read('fonts.ts')).toContain("import './soria.css';");
  });

  it('el cuerpo usa Soria con el respaldo local declarado', () => {
    expect(scale).toContain("--ff-body: 'Soria', Georgia, 'Times New Roman', serif;");
  });

  it('un solo estilo: sin negrita ni cursiva sintéticas, peso 400 e interlineado ≥ 1,55', () => {
    const body = /body \{([^}]*)\}/.exec(type)?.[1] ?? '';
    expect(body).toContain('font-synthesis: none;');
    expect(body).toContain('font-weight: 400;');
    const leading = Number(/line-height: ([\d.]+);/.exec(body)?.[1]);
    expect(leading).toBeGreaterThanOrEqual(1.55);
  });

  it('nada de texto por debajo de 16 px fuera de los mapas (Martín: las etiquetas pequeñas se leían mal)', () => {
    expect(scale).toContain('--step--1: 1rem;');
    expect(read('index.css')).toContain('--text-step--2: 1rem;');
    const srcDir = join(here, '..');
    const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.(css|tsx)$/.test(f) && !/test|marker\.css|map-palette|brick\.css|pixel\.css|bands\.css|Carousel/.test(f));
    for (const f of files) {
      const text = readFileSync(join(srcDir, f), 'utf8');
      expect(text.match(/font-size: *0\.\d+rem|text-\[0\.\d+rem\]|font-size: *1[0-5]px/g), f).toBeNull();
    }
  });

  it('los títulos conservan su fuente: h1 display, h2–h3 serif y h4–h6 en Inter', () => {
    expect(type).toMatch(/h1 \{[^}]*font-family: var\(--ff-display\)/);
    expect(type).toMatch(/h3 \{[^}]*font-family: var\(--ff-serif\)/);
    expect(type).toMatch(/h6 \{[^}]*font-family: var\(--ff-heading\)/);
    expect(scale).toContain("--ff-heading: 'Inter', system-ui, sans-serif;");
  });
});
