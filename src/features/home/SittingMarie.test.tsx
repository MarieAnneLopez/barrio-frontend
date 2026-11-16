import { cleanup, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES } from '../../lib/navigation';
import { renderRoute } from '../../test/renderRoute';

// D82: Mini Marie sentada solo en Inicio y Mapa 3D; decorativa (sin eventos ni lector de pantalla).
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
      expect(node.querySelector('.sequence[data-sequence="sit"]')).not.toBeNull();
    });
    cleanup();
  }, 15000);
});
