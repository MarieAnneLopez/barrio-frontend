import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/i18n';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES } from '../../lib/navigation';
import { staggerOrder } from './introMath';
import { introVariant, MENU_PATHS } from './introVariant';

const KEYS = ['corner', 'order', 'indents', 'reveal', 'revealWide'] as const;
const SECTIONS = [...NAV_BEFORE_CATEGORIES, ...NAV_AFTER_CATEGORIES];

/** Título que se ve en cada ruta del menú: el manifiesto en el Inicio y el nombre en los módulos. */
function titleKey(path: string): string {
  const category = CATEGORIES.find((item) => categoryPath(item.slug) === path);
  if (category) return `categories.${category.slug}.name`;
  return path === '/' ? 'home.manifesto.label' : `nav.${SECTIONS.find((item) => item.path === path)?.key ?? ''}`;
}

/** Lo que se ve de cada ruta: su variante y el turno real de cada palabra de su título. */
const seen = (lang: string) => MENU_PATHS.map((path) => {
  const words = i18n.getFixedT(lang)(titleKey(path)).split(/\s+/).filter(Boolean).length;
  return { path, words, variant: introVariant(path), turns: staggerOrder(introVariant(path).order, words) };
});

describe('variante de entrada por ruta (D101)', () => {
  it('sigue el orden del menú: secciones, los 14 módulos tras Historia y el resto', () => {
    expect(MENU_PATHS).toEqual([
      ...NAV_BEFORE_CATEGORIES.map((item) => item.path),
      ...CATEGORIES.map((category) => categoryPath(category.slug)),
      ...NAV_AFTER_CATEGORIES.map((item) => item.path),
    ]);
  });

  it('el Inicio es el manifiesto tal cual: abajo a la derecha, adelante, sangrías 0/26/4 y crema', () => {
    expect(introVariant('/')).toEqual({
      corner: 'br', order: 'forward', indents: [0, 26, 4], reveal: 'crema', revealWide: 'crema',
    });
  });

  it('dos secciones seguidas del menú no repiten esquina, orden, desfase ni color, en ningún ancho', () => {
    for (let at = 1; at < MENU_PATHS.length; at += 1) {
      const [before, now] = [introVariant(MENU_PATHS[at - 1] ?? ''), introVariant(MENU_PATHS[at] ?? '')];
      for (const key of KEYS) expect(now[key], `${MENU_PATHS[at]} · ${key}`).not.toEqual(before[key]);
    }
  });

  it.each(['es', 'en'])('en %s, recorriendo el menú real, el orden visible de las palabras tampoco se repite', (lang) => {
    const routes = seen(lang);
    for (const [at, now] of routes.entries()) {
      const before = routes[at - 1];
      if (!before) continue;
      const pair = `${lang}: ${before.path} → ${now.path}`;
      expect(now.words, `${pair}: el título existe`).toBeGreaterThan(0);
      if (before.words > 1 || now.words > 1) expect(now.turns, pair).not.toEqual(before.turns);
      // Con una palabra a cada lado no hay orden que variar: el efecto cambia por la esquina y el color.
      else expect([now.variant.corner, now.variant.reveal], pair).not.toEqual([before.variant.corner, before.variant.reveal]);
    }
  });

  it('es determinista y las rutas fuera del menú también tienen la suya', () => {
    expect(introVariant('/creditos-fotos')).toEqual(introVariant('/creditos-fotos'));
    expect(introVariant('/no-existe').reveal).toMatch(/^(crema|rosa-claro|rosa)$/);
    expect(introVariant('/historia/')).toEqual(introVariant('/historia'));
  });
});
