import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES } from '../../lib/navigation';
import { renderRoute } from '../../test/renderRoute';

// D82, D86: Mini Marie sentada solo en Inicio y Mapa 3D; decorativa (sin eventos ni lector de
// pantalla), a 48 px sin escalar y sobre una repisa de 1 px en el borde inferior de la maqueta.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'sitting.css'), 'utf8');
const ROUTES = [
  ...[...NAV_BEFORE_CATEGORIES, ...NAV_AFTER_CATEGORIES].map((item) => item.path),
  ...CATEGORIES.map((category) => categoryPath(category.slug)),
  '/creditos-fotos',
  '/no-existe',
];

describe('Mini Marie sentada (D82)', () => {
  it.each(ROUTES)('%s', async (path) => {
    renderRoute(path);
    // Las páginas se cargan en diferido: se espera su título antes de contar.
    await waitFor(() => expect(document.querySelector('main h1')).not.toBeNull(), { timeout: 8000 });
    const sitting = document.querySelectorAll('[data-mascot="sentada"]');
    expect(sitting).toHaveLength(path === '/' || path === '/mapa' ? 1 : 0);
    sitting.forEach((node) => {
      expect(node).toHaveAttribute('aria-hidden', 'true');
      const sprite = node.querySelector<HTMLElement>('.sequence[data-sequence="sit"]');
      expect([sprite?.style.width, sprite?.style.height]).toEqual(['29px', '48px']);
      expect(node.querySelector('.sitting-marie__ledge')).not.toBeNull();
    });
    cleanup();
  }, 15000);

  it('se sienta en el borde inferior: el asiento (60 %) sobre la línea y las piernas por debajo', () => {
    const block = (selector: string) => new RegExp(`\\${selector} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';
    expect(block('.sitting-marie')).toMatch(/bottom: -19px;/); // 40 % de 48 px
    expect(block('.sitting-marie')).toMatch(/right: clamp\(96px, 22vw, 320px\);/);
    expect(block('.sitting-marie')).not.toMatch(/\btop:/);
    expect(block('.sitting-marie__ledge')).toMatch(/width: 72px;\s*height: 1px;\s*background-color: var\(--text-highlight\);/);
  });
});
