import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readSrc, srcDir } from '../test/classContrast';

// Etapa 2 (D84): el estilo «ladrillo y píxel» sale de la app. Sus hojas quedan en disco (no se
// borra nada), pero ya no se importan y ningún componente usa sus clases.
const files = (ext: string) => readdirSync(srcDir, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith(ext));
const LEGACY_SHEETS = ['pixel.css', 'brick.css', 'bands.css'];
const LEGACY_CLASSES = new Set([
  'glass', 'eyebrow', 'brick-card', 'brick-bond', 'brick-bond--nav', 'brick-bond--vino', 'band-text', 'band-rosa',
  'band-piedra', 'px-corners', 'pixel-art', 'pixel-font', 'pixel-bubble', 'pixel-bubble--tail', 'plate-enter', 'font-pixel',
]);
// Cadenas de texto del código: entre comillas simples o dobles (una línea) y plantillas.
const STRINGS = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

describe('fuera el estilo «ladrillo y píxel» (etapa 2)', () => {
  it('index.css ya no importa sus hojas, y sí las de tonos y superficies', () => {
    const index = readSrc('styles', 'index.css');
    for (const sheet of LEGACY_SHEETS) expect(index).not.toContain(sheet);
    for (const sheet of ['tone.css', 'surfaces.css']) expect(index).toContain(`@import './${sheet}'`);
    expect(index).not.toMatch(/\.glass\b/);
  });

  it('ningún componente usa sus clases', () => {
    const found: string[] = [];
    for (const file of files('.tsx').filter((name) => !name.includes('.test.'))) {
      for (const literal of readSrc(file).match(STRINGS) ?? []) {
        for (const token of literal.split(/[\s'"`${}?:]+/)) if (LEGACY_CLASSES.has(token)) found.push(`${file}: ${token}`);
      }
    }
    expect(found).toEqual([]);
  });

  it('los colores primitivos solo se nombran en tokens.css y scale.css', () => {
    const allowed = ['tokens.css', 'scale.css', 'map-palette.css', ...LEGACY_SHEETS];
    const found = files('.css')
      .filter((file) => !allowed.some((name) => file.endsWith(name)))
      .flatMap((file) => (readSrc(file).match(/var\(--(?:c|palette)-[\w-]+\)/g) ?? []).map((use) => `${file}: ${use}`));
    expect(found).toEqual([]);
    expect(readSrc('styles', 'tokens.css')).not.toMatch(/--palette-/);
    expect(readSrc('styles', 'scale.css')).not.toMatch(/--ff-pixel|--px:|--shadow-brick/);
  });
});
