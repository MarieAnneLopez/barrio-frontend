import { describe, expect, it } from 'vitest';
import { colorsIn } from './paletteScan';

// Menor aplazado de la etapa 1: el escáner de paleta de tokens.test.ts solo veía hex de 6 cifras y
// rgb(); se le escapaban #fff, los hex con transparencia, hsl() y los nombres de color.
describe('escáner de colores de las hojas de estilo', () => {
  it('lee hex de 3, 4, 6 y 8 cifras (sin la transparencia) y rgb() con comas o con espacios', () => {
    const css = 'a{color:#fff;background:#0000;border-color:#283845;box-shadow:0 8px 24px #0000002e}'
      + 'b{color:rgb(75 96 127 / 50%);background-color:rgba(232, 216, 201, .4)}';
    expect(colorsIn(css)).toEqual(['ffffff', '000000', '283845', '000000', '4b607f', 'e8d8c9']);
  });

  it('devuelve tal cual lo que no puede traducir: funciones de color y nombres de color', () => {
    const css = 'a{color:hsl(270 50% 50%);background-color:violet;outline-color:oklch(0.7 0.1 300)}'
      + 'b{color:transparent;border-color:currentColor;--tono:purple}';
    expect(colorsIn(css)).toEqual(['hsl(', 'violet', 'oklch(', 'purple']);
  });

  it('no confunde nombres de clase, de animación ni de fuente con colores', () => {
    const css = '.ui-btn--white-ish{animation:red-glow 1s}@keyframes red-glow{to{opacity:1}}'
      + 'h1{font-family:"Anton", sans-serif;grid-area:navy}a[href="#contenido"]{color:var(--text-primary)}';
    expect(colorsIn(css)).toEqual([]);
  });
});
