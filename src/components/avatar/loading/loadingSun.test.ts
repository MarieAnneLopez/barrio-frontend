import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cssLength, type LengthContext } from '../../../test/cssGeometry';

const here = dirname(fileURLToPath(import.meta.url));
const read = (...path: string[]) => readFileSync(join(here, ...path), 'utf8');
const REM = 16;

/** Declaraciones de la regla cuyo selector es exactamente `selector`, al principio de una línea. */
function block(css: string, selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const body = new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';
  return Object.fromEntries([...body.matchAll(/([-\w]+): ([^;]+);/g)].map(([, name = '', value = '']) => [name, value.trim()]));
}

const sun = block(read('loading-scene.css'), '.loading-scene__sun');
const screenCss = read('../loading-screen.css');
const floor = block(screenCss, '.loading-screen__floor');
const ground = block(screenCss, '.loading-screen__ground');
const bar = block(read('loading-bar.css'), '.loading-bar');
// El texto de la carga: --step--1 (scale.css) por el interlineado del cuerpo (index.css).
const step = /--step--1: ([^;]+);/.exec(read('../../../styles/scale.css'))?.[1] ?? '';
const leading = Number(/line-height: ([\d.]+);/.exec(read('../../../styles/index.css'))?.[1]);

/** Alto del escenario: la pantalla menos el suelo de 1 px y la franja de la barra y el texto. */
function stageHeight(vw: number, vh: number): number {
  const ctx: LengthContext = { vw, vh, rem: REM, percent: 0, vars: {} };
  const [top = '0', , bottom = '0'] = (floor.padding ?? '').split(' ');
  const parts = [top, floor.gap ?? '0', bar.height ?? '0', bottom, ground.height ?? '0'];
  return vh - parts.reduce((sum, part) => sum + cssLength(part, ctx), 0) - cssLength(step, ctx) * leading;
}

/** Caja del sol (px desde arriba del escenario) con la Mini Marie de `runner` px de alto. */
function sunBox(vw: number, vh: number, runner: number) {
  const stage = stageHeight(vw, vh);
  const own = Object.fromEntries(Object.entries(sun).filter(([name]) => name.startsWith('--')));
  const ctx: LengthContext = { vw, vh, rem: REM, percent: stage, vars: { ...own, '--runner': `${runner}px` } };
  const size = cssLength(sun.width ?? '', ctx);
  const top = cssLength(sun.top ?? '', ctx);
  return { stage, size, top, bottom: top + size };
}

// Auditoría MM-08 y PAL-07: la protección de D102 solo cubría la Mini Marie de 420 px. Con 210 y un
// escenario bajo (celular en horizontal), su cabeza pasaba por delante del sol amarillo.
describe('el sol de la carga nunca queda detrás de Mini Marie (nunca sobre amarillo)', () => {
  it.each([
    [844, 390], [740, 360], [390, 844], [1440, 800], [1440, 900], [667, 375], [932, 430], [640, 360], [568, 320], [1024, 600],
  ])('a %i × %i px el sol queda entero por encima de su cabeza, o fuera', (vw, vh) => {
    const runner = vw >= 640 && vh >= 860 ? 420 : 210; // LOADER_WIDE
    const { stage, size, bottom } = sunBox(vw, vh, runner);
    expect(bottom).toBeLessThanOrEqual(stage - runner); // la caja de ella entera, pelo incluido
    const visible = Math.min(Math.max(bottom, 0), size);
    expect(visible === 0 || visible >= size / 2).toBe(true); // ni una astilla amarilla en el borde
  });

  it.each([[390, 844], [1440, 800], [1440, 900], [640, 860]])('a %i × %i px, donde cabe, sigue arriba a la derecha como antes (7 %)', (vw, vh) => {
    const { stage, top } = sunBox(vw, vh, vw >= 640 && vh >= 860 ? 420 : 210);
    expect(top).toBeCloseTo(0.07 * stage, 5);
  });

  it('cuenta con el alto real de ella (--runner, que pone LoadingScreen) y con el del escenario', () => {
    expect(sun.top).toMatch(/var\(--(runner|room)/);
    expect(sun.width).toMatch(/var\(--sun\)|clamp/);
  });
});
