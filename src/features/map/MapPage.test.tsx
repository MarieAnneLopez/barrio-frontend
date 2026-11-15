import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  setViewport(true);
  mockApi({});
});

describe('Mapa 3D (/mapa)', () => {
  it('tiene página propia con la maqueta y los 14 mapas temáticos', async () => {
    const { router, container } = renderRoute('/mapa');
    expect(await screen.findByRole('heading', { level: 1, name: 'Mapa 3D' })).toBeInTheDocument();
    expect(screen.queryByText('En construcción')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' })).toBeInTheDocument();
    const thematic = screen.getByRole('region', { name: 'Mapas temáticos' });
    const links = within(thematic).getAllByRole('link');
    expect(links).toHaveLength(14);
    expect(links[0]).toHaveAttribute('href', '/categorias/centros-educativos');
    expect(screen.getByText(/no una unidad administrativa oficial/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/mapa');
    const { default: axe } = await import('axe-core');
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
