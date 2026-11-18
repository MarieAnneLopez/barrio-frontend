import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { denserThan } from '../../lib/density';
import { LOADER_WIDE } from './loadingRun';
import { spriteUrl } from './sequences';

interface Screen { w: number; h: number; dppx: number }

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../index.html'), 'utf8');
const preloads = [...html.matchAll(/<link rel="preload" as="image" type="image\/webp" href="([^"]+)" media="([^"]+)" \/>/g)]
  .map(([, href, media]) => ({ href, media: media ?? '' }));

/** Evalúa las media queries de estos enlaces (min/max de ancho, alto y densidad) en una pantalla. */
function matches(media: string, { w, h, dppx }: Screen): boolean {
  const value: Record<string, number> = { width: w, height: h, resolution: dppx, 'device-pixel-ratio': dppx };
  return media.split(', ').some((query) =>
    query.split(' and ').every((part) => {
      const [, bound, feature = '', amount] = /^\((?:-webkit-)?(min|max)-([a-z-]+): ([\d.]+)[a-z]*\)$/.exec(part) ?? [];
      const actual = value[feature] ?? Number.NaN;
      return bound === 'min' ? actual >= Number(amount) : actual <= Number(amount);
    }),
  );
}

/** El atlas que pinta la pantalla de carga: 420 px de alto si cabe (si no, 210) o el doble exacto en pantallas densas. */
const painted = ({ w, h, dppx }: Screen) => spriteUrl('run', (w >= 640 && h >= 860) || dppx >= 1.01 ? 420 : 210);

// Revisión de sprites32: el atlas de la carrera (412 KB a 420) se pedía solo cuando React pintaba la
// pantalla de carga, compitiendo con el código justo cuando debe verse. index.html lo pide al leerse.
describe('pantalla de carga: el atlas de la carrera se pide antes que el código', () => {
  it('un enlace de precarga por atlas, con la misma condición que la pantalla de carga', () => {
    expect(preloads.map((p) => p.href)).toEqual([spriteUrl('run', 420), spriteUrl('run', 210)]);
    expect(preloads[0]?.media).toBe(`${LOADER_WIDE}, ${denserThan(1.01)}`);
  });

  it.each([
    [1440, 900, 1], [1440, 900, 2], [1280, 720, 1.25], [1024, 650, 1], [800, 600, 1], [600, 900, 1],
    [390, 844, 3], [360, 640, 2], [360, 640, 1], [639, 1000, 1], [640, 859, 1], [640, 860, 1], [1366, 768, 1],
  ])('a %i × %i px y %f dppx precarga justo el atlas que se pinta (y nada más)', (w, h, dppx) => {
    const screen = { w, h, dppx };
    expect(preloads.filter((p) => matches(p.media, screen)).map((p) => p.href)).toEqual([painted(screen)]);
  });
});
