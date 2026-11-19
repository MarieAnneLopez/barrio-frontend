import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { frameAt, offsetAt, positionAt, RUN, runKeyframes, runPath, stridePx } from './loadingRun';
import { cellWidth, FRAME_MS } from './sequences';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'loading-screen.css'), 'utf8');

// Pantalla de carga: Mini Marie parecía ir hacia atrás. Corría en su sitio mientras el suelo pasaba a
// 89 px/s, entre 2,5 y 5 veces más lento que su pie apoyado: el pie patinaba contra el suelo.
// sprites32: el ciclo tiene 32 cuadros a 24 fps; avanza por cuadro la zancada / 32, redondeada.
describe('carrera de la pantalla de carga', () => {
  it('avanza hacia la derecha y mira a la derecha (los cuadros dibujados ya miran a ese lado)', () => {
    expect(RUN.direction).toBe(1);
    expect(RUN.facing).toBe('right');
  });

  it('el ciclo de 32 cuadros va a 24 cuadros por segundo', () => {
    expect(FRAME_MS.run).toBeCloseTo(1000 / 24);
    expect(RUN.fps).toBeCloseTo(24);
  });

  it('zancada medida en la hoja de Martín: 112 px por ciclo a 420 de alto (3,5 por cuadro), 56 a 210 y 28 a 105', () => {
    expect([stridePx(420), stridePx(210), stridePx(105)]).toEqual([112, 56, 28]);
  });

  it('cada cuadro avanza zancada / 32 redondeada: px enteros que no acumulan error', () => {
    for (const size of [105, 210, 420]) {
      const per = stridePx(size) / 32;
      for (let n = 1; n <= 96; n += 1) {
        const x = offsetAt(n, size);
        expect(Number.isInteger(x)).toBe(true);
        expect(Math.abs(x - n * per)).toBeLessThanOrEqual(0.5); // nunca a más de medio px de la recta
        expect([Math.floor(per), Math.ceil(per)]).toContain(x - offsetAt(n - 1, size));
      }
      expect(offsetAt(32, size)).toBe(stridePx(size)); // tras un ciclo, una zancada exacta
    }
    expect([...Array(9).keys()].map((n) => offsetAt(n, 105))).toEqual([0, 1, 2, 3, 4, 4, 5, 6, 7]);
  });

  it('cruza toda la pantalla, de fuera a fuera, en cuadros enteros', () => {
    const sprite = cellWidth('run', 210);
    const path = runPath(390, 210, sprite);
    expect(path.start).toBe(-154); // entra entera desde fuera, por la izquierda
    expect(path.frames).toBe(312); // 544 px a 1,75 px por cuadro: sale en el 311 y ese se ve entero
    expect(path.distance).toBe(offsetAt(312, 210));
    expect(path.durationMs).toBeCloseTo(312 * FRAME_MS.run);
  });

  // Auditoría MM-07: en bucle (iterations: Infinity) el fotograma clave final, el de offset 1, no se
  // pinta nunca: el último que se ve es el anterior. Ese ya debe dejarla entera fuera, por la derecha;
  // si no, un trozo de bota desaparece de golpe en el borde.
  it.each([[390, 210], [768, 210], [844, 210], [1440, 420], [1920, 420]])(
    'a %i px de ancho y %i de alto, el último cuadro que se pinta ya la deja fuera, sin cuadros de más', (viewport, size) => {
      const path = runPath(viewport, size, cellWidth('run', size));
      expect(path.start + offsetAt(path.frames - 1, size)).toBeGreaterThanOrEqual(viewport);
      expect(path.start + offsetAt(path.frames - 2, size)).toBeLessThan(viewport);
    });

  // Auditoría MM-10: al girar el celular el recorrido seguía con el ancho de antes. Se rehace con el
  // nuevo, desde la misma posición; si en la pantalla nueva ya habría salido, vuelve a entrar.
  it('rehacer el recorrido conserva su posición, y en bucle cuenta desde la entrada', () => {
    const [narrow, wide] = [runPath(390, 210, 98), runPath(844, 210, 98)];
    const at = positionAt(narrow, 210, 50.5 * FRAME_MS.run);
    expect(at).toBe(-98 + offsetAt(50, 210));
    expect(frameAt(wide, 210, at)).toBe(50);
    expect(frameAt(narrow, 210, positionAt(wide, 210, 400.5 * FRAME_MS.run))).toBe(0);
    expect(positionAt(narrow, 210, narrow.durationMs + 2.5 * FRAME_MS.run)).toBe(-98 + offsetAt(2, 210));
  });

  it('un fotograma clave por cuadro, en px enteros, sostenido hasta el cuadro siguiente', () => {
    const path = runPath(390, 210, 98);
    const keys = runKeyframes(path, 210);
    expect(keys).toHaveLength(path.frames + 1);
    expect(keys[0]).toEqual({ offset: 0, easing: 'step-end', transform: 'translate3d(-98px, 0, 0)' });
    expect(keys[1]?.transform).toBe('translate3d(-96px, 0, 0)'); // 1,75 → 2 px
    expect(keys.at(-1)).toMatchObject({ offset: 1, transform: `translate3d(${path.distance - 98}px, 0, 0)` });
    expect(keys.every((k) => /^translate3d\(-?\d+px, 0, 0\)$/.test(String(k.transform)))).toBe(true);
  });

  it('el suelo es una línea quieta de 1 px; solo se mueve ella, con transform', () => {
    expect(css).toMatch(/\.loading-screen__ground \{[^}]*height: 1px;/);
    expect(css).not.toMatch(/\.loading-screen__ground \{[^}]*animation/);
    expect(css).not.toMatch(/\b(left|top):[^;]*var\(--run/);
  });
});
