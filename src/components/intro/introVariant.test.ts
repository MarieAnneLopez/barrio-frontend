import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES } from '../../lib/navigation';
import { introVariant, MENU_PATHS } from './introVariant';

const KEYS = ['corner', 'order', 'indents', 'reveal'] as const;

describe('variante de entrada por ruta (D101)', () => {
  it('sigue el orden del menú: secciones, los 14 módulos tras Historia y el resto', () => {
    expect(MENU_PATHS).toEqual([
      ...NAV_BEFORE_CATEGORIES.map((item) => item.path),
      ...CATEGORIES.map((category) => categoryPath(category.slug)),
      ...NAV_AFTER_CATEGORIES.map((item) => item.path),
    ]);
  });

  it('el Inicio es el manifiesto tal cual: abajo a la derecha, adelante, sangrías 0/26/4 y crema', () => {
    expect(introVariant('/')).toEqual({ corner: 'br', order: 'forward', indents: [0, 26, 4], reveal: 'crema' });
  });

  it('dos secciones seguidas del menú no repiten esquina, orden, desfase ni color', () => {
    for (let at = 1; at < MENU_PATHS.length; at += 1) {
      const [before, now] = [introVariant(MENU_PATHS[at - 1] ?? ''), introVariant(MENU_PATHS[at] ?? '')];
      for (const key of KEYS) expect(now[key], `${MENU_PATHS[at]} · ${key}`).not.toEqual(before[key]);
    }
  });

  it('es determinista y las rutas fuera del menú también tienen la suya', () => {
    expect(introVariant('/creditos-fotos')).toEqual(introVariant('/creditos-fotos'));
    expect(introVariant('/no-existe').reveal).toMatch(/^(crema|rosa-claro|rosa)$/);
    expect(introVariant('/historia/')).toEqual(introVariant('/historia'));
  });
});
