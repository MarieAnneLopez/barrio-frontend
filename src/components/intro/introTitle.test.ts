import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/i18n';
import { fitSize, splitLines, titleSize } from './introMath';
import { introVariant } from './introVariant';

// Cuerpo del titular de la entrada en px reales: la cuenta de section-intro.css con los títulos reales.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'section-intro.css'), 'utf8');
/** Rutas con entrada de sección (PageHeader) y la clave de su título. */
const TITLES = [
  ['/historia', 'nav.history'], ['/ranking', 'nav.ranking'], ['/galeria', 'nav.gallery'], ['/preguntas', 'nav.faq'],
  ['/creadora', 'nav.creator'], ['/ayuda', 'nav.help'], ['/acceso', 'nav.access'],
  ['/creditos-fotos', 'credits.title'], ['/no-existe', 'notFound.title'],
] as const;
/** Ancho de la entrada en la columna de AppShell: px-4; desde 768 px, pl-10 + pr-20; desde 1280, 1200 − 80. */
const column = (w: number): number => (w >= 1280 ? 1120 : w >= 768 ? w - 120 : w - 32);
/** La barra de accesibilidad cambia 1rem: 90 %, 100 %, 112,5 % y 125 % (a11yStore.FONT_SCALES). */
const REMS = [14.4, 16, 18, 20];

const titles = () =>
  ['es', 'en'].flatMap((lang) => TITLES.map(([path, key]) => {
    const lines = splitLines(i18n.getFixedT(lang)(key).split(/\s+/).filter(Boolean));
    return { name: `${lang} ${path}`, lines: lines.length, fit: fitSize(lines, introVariant(path).indents) };
  }));

describe('cuerpo del titular de la entrada (D110: un título marrón mide ≥ 24 px reales)', () => {
  it('la hoja hace la misma cuenta, con un piso de 24 px en px (la letra al 90 % no lo baja)', () => {
    expect(css).toContain('--leading: 0.96;');
    expect(css).toContain(
      'font-size: max(24px, min(calc(var(--fit) * 1cqw), calc((52svh - 10rem) / (var(--lines) * var(--leading))), 9rem));',
    );
  });

  it.each([[390, 844], [844, 390], [740, 360], [768, 1024], [1440, 900]])(
    'a %i × %i px ningún título real baja de 24 px ni se sale a lo ancho, con la letra a cualquier tamaño',
    (w, h) => {
      for (const { name, lines, fit } of titles()) {
        for (const rem of REMS) {
          const size = titleSize({ fit, lines, width: column(w), height: h, rem });
          expect(size, `${name}, 1rem = ${rem} px`).toBeGreaterThanOrEqual(24);
          expect(size, `${name} cabe a lo ancho`).toBeLessThanOrEqual((fit * column(w)) / 100);
        }
      }
    },
  );

  it('en una pantalla baja se queda en 24 px y la entrada crece en alto, en vez de encoger o desaparecer', () => {
    // 844 × 390 con 3 líneas: el alto daba (202,8 − 160) / 2,88 = 14,9 px; a 568 × 300, menos de 0.
    expect(titleSize({ fit: 10.8, lines: 3, width: 724, height: 390 })).toBe(24);
    expect(titleSize({ fit: 10.8, lines: 3, width: 536, height: 300 })).toBe(24);
    expect(titleSize({ fit: 10.8, lines: 3, width: 724, height: 390, rem: 20 })).toBe(24);
  });

  it('donde cabe, nada cambia: manda el ancho o el alto, y 9rem es el techo', () => {
    expect(titleSize({ fit: 16.2, lines: 3, width: 1120, height: 900 })).toBeCloseTo((468 - 160) / 2.88, 6);
    expect(titleSize({ fit: 10.8, lines: 3, width: 358, height: 844 })).toBeCloseTo(38.664, 6);
    expect(titleSize({ fit: 16.2, lines: 1, width: 1120, height: 900 })).toBe(144);
  });
});
