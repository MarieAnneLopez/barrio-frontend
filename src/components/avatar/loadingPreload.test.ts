import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { denserThan } from '../../lib/density';
import { painted, type Screen } from '../../test/loaderScreens';
import { LOADER_WIDE } from './loadingRun';
import { spriteUrl } from './sequences';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../index.html'), 'utf8');
const preloads = [...html.matchAll(/<link rel="preload" as="image" type="image\/webp" href="([^"]+)" media="([^"]+)" \/>/g)]
  .map(([, href, media]) => ({ href, media: media ?? '' }));

/**
 * Evalúa estas media queries de nivel 3 (lista con coma; min/max de ancho, alto y densidad, unidas
 * con and) en una pantalla. `resolution: false` imita a Safari antes del 16, que solo entiende la
 * forma -webkit-: allí una consulta con `resolution` no coincide nunca.
 */
function matches(media: string, { w, h, dppx }: Screen, resolution = true): boolean {
  const value: Record<string, number> = { width: w, height: h, 'device-pixel-ratio': dppx };
  if (resolution) value.resolution = dppx;
  return media.split(', ').some((query) =>
    query.split(' and ').every((part) => {
      const [, bound, feature = '', amount] = /^\((?:-webkit-)?(min|max)-([a-z-]+): ([\d.]+)[a-z]*\)$/.exec(part) ?? [];
      const actual = value[feature] ?? Number.NaN;
      return bound === 'min' ? actual >= Number(amount) : actual <= Number(amount);
    }),
  );
}

// Auditoría MM-01: a 1,25–3 dppx la carga estiraba el atlas de 1× (a 3 dppx, borroso). Se pinta y se
// precarga el que dice `painted`, en las medidas de la auditoría y en los bordes de cada condición.
const DPPX = [1, 1.25, 1.5, 1.75, 2, 2.625, 3];
const SCREENS: [number, number, number][] = [
  ...[[390, 844], [1440, 800], [1440, 900]].flatMap(([w = 0, h = 0]) => DPPX.map((dppx): [number, number, number] => [w, h, dppx])),
  [1280, 720, 1.25], [1024, 650, 1], [800, 600, 1], [600, 900, 1], [360, 640, 2], [360, 640, 1],
  [639, 1000, 1], [640, 859, 1], [640, 860, 1], [1366, 768, 1], [844, 390, 3], [1440, 900, 1.005],
];

// Revisión de sprites32: el atlas de la carrera (412 KB a 420) se pedía solo cuando React pintaba la
// pantalla de carga, compitiendo con el código justo cuando debe verse. index.html lo pide al leerse.
describe('pantalla de carga: el atlas de la carrera se pide antes que el código', () => {
  it('un enlace de precarga por atlas: el de 420 donde cabe a ese alto o la pantalla es densa', () => {
    expect(preloads.map((p) => p.href)).toEqual([spriteUrl('run', 420), spriteUrl('run', 210)]);
    expect(preloads[0]?.media).toBe(`${LOADER_WIDE}, ${denserThan(1.01)}`);
  });

  it.each(SCREENS)('a %i × %i px y %f dppx precarga justo el atlas que se pinta (y nada más)', (w, h, dppx) => {
    const screen = { w, h, dppx };
    for (const resolution of [true, false]) {
      expect(preloads.filter((p) => matches(p.media, screen, resolution)).map((p) => p.href)).toEqual([painted(screen)]);
    }
  });
});
