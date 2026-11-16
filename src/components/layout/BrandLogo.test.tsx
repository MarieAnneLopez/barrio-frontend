import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../../test/renderRoute';

describe('Logo del encabezado (D82)', () => {
  it('es el rostro sonriente de Mini Marie con el nombre del sitio', async () => {
    renderRoute('/');
    const logo = await screen.findByRole('img', { name: 'Reconoce tu Barrio: El Tintal' });
    expect(logo.closest('header')).not.toBeNull();
    expect(logo.querySelector('img')?.getAttribute('src')).toBe('/assets/brand/marie-logo-96.png');
  });
});
