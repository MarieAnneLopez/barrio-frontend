import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RUN, runPath, stepPx } from './loadingRun';
import { cellWidth, FRAME_MS } from './sequences';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'loading-screen.css'), 'utf8');

// Pantalla de carga: Mini Marie parecía ir hacia atrás. Corría en su sitio mientras el suelo pasaba a
// 89 px/s, entre 2,5 y 5 veces más lento que su pie apoyado: el pie patinaba contra el suelo.
describe('carrera de la pantalla de carga', () => {
  it('avanza hacia la derecha y mira a la derecha (los cuadros dibujados ya miran a ese lado)', () => {
    expect(RUN.direction).toBe(1);
    expect(RUN.facing).toBe('right');
  });

  it('el ciclo va a 10 cuadros por segundo, dentro de 8–12', () => {
    expect(FRAME_MS.run).toBe(100);
    expect(RUN.fps).toBe(10);
  });

  it('avanza por cuadro lo que retrocede el pie apoyado (38 px a 420 de alto, la mitad a 210): no patina', () => {
    expect(stepPx(420)).toBe(38);
    expect(stepPx(210)).toBe(19);
  });

  it('cruza toda la pantalla en pasos enteros de px, sincronizados con los cuadros', () => {
    const sprite = cellWidth('run', 210);
    const path = runPath(390, 210, sprite);
    expect(path.start).toBe(-98); // entra entera desde fuera, por la izquierda
    expect(path.distance).toBeGreaterThanOrEqual(390 + 98); // y sale entera por la derecha
    expect(path.distance).toBe(path.steps * 19);
    expect(path.durationMs).toBe(path.steps * FRAME_MS.run);
    expect(Number.isInteger(path.start) && Number.isInteger(path.distance)).toBe(true);
  });

  it('el suelo es una línea quieta de 1 px; solo se mueve ella, con transform en pasos', () => {
    expect(css).toMatch(/\.loading-screen__ground \{[^}]*height: 1px;/);
    expect(css).not.toMatch(/\.loading-screen__ground \{[^}]*animation/);
    expect(css).toMatch(/@keyframes loading-run \{[\s\S]*translate3d\(var\(--run-start\)[\s\S]*translate3d\(var\(--run-end\)/);
    expect(css).not.toMatch(/\b(left|top):[^;]*var\(--run/);
  });
});
