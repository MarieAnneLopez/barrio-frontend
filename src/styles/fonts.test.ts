import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// D85: Anton (display), Cormorant Garamond cursiva (títulos de sección y de foto) e Inter fina.
const here = dirname(fileURLToPath(import.meta.url));
const fonts = readFileSync(join(here, 'fonts.ts'), 'utf8');
const scale = readFileSync(join(here, 'scale.css'), 'utf8');

describe('tipografía base (D85)', () => {
  it('carga Anton, Cormorant Garamond cursiva e Inter fina desde @fontsource (sin enlaces externos)', () => {
    for (const file of [
      '@fontsource/anton/latin-400.css',
      '@fontsource/cormorant-garamond/latin-500-italic.css',
      '@fontsource/cormorant-garamond/latin-600-italic.css',
      '@fontsource/inter/latin-300.css',
    ]) {
      expect(fonts).toContain(`'${file}'`);
    }
    expect(fonts).not.toMatch(/https?:\/\//);
  });

  it('retira de los estilos las fuentes de píxel, grotesca y monoespaciada', () => {
    for (const family of ['press-start-2p', 'space-grotesk', 'jetbrains-mono']) expect(fonts).not.toContain(family);
    expect(scale).not.toMatch(/Press Start 2P|Space Grotesk|JetBrains Mono/);
  });

  it('los tokens de fuente apuntan a las familias nuevas', () => {
    expect(scale).toMatch(/--ff-display: 'Anton'/);
    expect(scale).toMatch(/--ff-serif: 'Cormorant Garamond'/);
    expect(scale).toMatch(/--ff-body: 'Inter'/);
  });
});
