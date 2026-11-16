import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES } from '../../lib/navigation';
import { renderRoute } from '../../test/renderRoute';

// D82, D86, D88: Mini Marie sentada solo en Inicio y Mapa 3D; decorativa (sin eventos ni lector de
// pantalla), a 48 px sin escalar, sobre el borde superior del recuadro y casi en su esquina derecha.
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
      expect(node.querySelector('.sitting-marie__ledge')).toBeNull(); // su asiento es el borde del recuadro
    });
    cleanup();
  }, 15000);

  it('se sienta arriba a la derecha, casi en la esquina: el asiento (60 %) en el borde y las piernas hacia el mapa', () => {
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const base = /\.sitting-marie \{([^}]*)\}/.exec(rules)?.[1] ?? '';
    expect(base).toMatch(/top: -29px;/); // 60 % de 48 px por encima del borde superior
    expect(base).toMatch(/right: -4px;/); // a 12 px de la esquina cuando el recuadro va de lado a lado
    expect(base).not.toMatch(/\bbottom:/);
    // Desde md el recuadro ya no va de lado a lado: los mismos 12 px desde su esquina.
    expect(rules).toMatch(/@media \(min-width: 48rem\) \{\s*\.sitting-marie \{\s*right: 12px;\s*\}\s*\}/);
  });
});
