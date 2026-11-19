import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Fuentes del primer pintado: además de Soria (D98), index.html precarga las dos que pintan el LCP
// medido. Anton 400 es el titular del manifiesto y de cada entrada (el LCP a 1440 px); Cormorant
// Garamond 500 cursiva, la frase del manifiesto y la bajada de cada entrada (el LCP en el celular). Las
// dos se descubrían solo al aplicar el CSS. Cada enlace apunta al mismo archivo que pide la hoja de
// @fontsource y Vite les da el mismo nombre con hash en el build: una sola descarga.
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const fonts = readFileSync(join(root, 'src/styles/fonts.ts'), 'utf8');
const preloads = [...html.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin \/>/g)]
  .map(([, href]) => href ?? '');

describe('precarga de las fuentes del primer pintado', () => {
  it('Soria y solo dos más, Anton 400 y Cormorant Garamond 500 cursiva, en woff2 con crossorigin', () => {
    expect(preloads).toEqual([
      '/assets/fonts/soria/soria.woff2',
      '/node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2',
      '/node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2',
    ]);
    expect(html.match(/as="font"/g)).toHaveLength(3); // ninguna otra precarga de fuente
  });

  it.each([
    ['@fontsource/anton/latin-400.css', 'anton-latin-400-normal.woff2'],
    ['@fontsource/cormorant-garamond/latin-500-italic.css', 'cormorant-garamond-latin-500-italic.woff2'],
  ])('fonts.ts carga %s, que pide justo el archivo precargado (%s)', (sheet, file) => {
    expect(fonts).toContain(`'${sheet}'`);
    expect(readFileSync(join(root, 'node_modules', sheet), 'utf8')).toContain(`url(./files/${file}) format('woff2')`);
    expect(preloads.filter((href) => href.endsWith(`/files/${file}`))).toHaveLength(1);
  });
});
