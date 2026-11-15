import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearBaseMapCache } from '../../components/map/baseMapData';
import { CATEGORIES } from '../../lib/categoryConfig';
import { useHeroStore } from '../../three/heroStore';
import { callsTo, mockApi } from '../../test/mockApi';
import { BASE_MAP, FEATURES } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

vi.mock('../../three/TintalScene', () => ({ default: () => <div data-testid="escena-3d" /> }));

beforeEach(() => {
  clearBaseMapCache();
  setViewport(true);
  act(() => useHeroStore.setState({ hidden: [], drawn: {}, selected: null }));
});

describe('Maqueta 3D con los 14 módulos (H34)', () => {
  it('pide el GeoJSON de los 14 módulos, no solo Centros Educativos', async () => {
    const fetchMock = mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    for (const { slug } of CATEGORIES) expect(callsTo(fetchMock, `/${slug}/geojson`)).toHaveLength(1);
  });

  it('la leyenda muestra lo dibujado por categoría y el filtro oculta y vuelve a mostrar', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/mapa');
    await screen.findByTestId('escena-3d');
    act(() => useHeroStore.getState().setDrawn({ 'centros-educativos': 5, 'datos-catastrales': 3706 }));
    const legend = screen.getByRole('list', { name: 'Leyenda y filtro' });
    expect(within(legend).getAllByRole('button')).toHaveLength(14);
    const lots = within(legend).getByRole('button', { name: /Datos Catastrales/ });
    expect(lots).toHaveTextContent(/3\.?706/);
    expect(within(legend).getByRole('button', { name: /Barberías/ })).toHaveTextContent('sin datos');

    await userEvent.click(lots);
    expect(lots).toHaveAttribute('aria-pressed', 'false');
    expect(useHeroStore.getState().hidden).toEqual(['datos-catastrales']);
    await userEvent.click(lots);
    expect(useHeroStore.getState().hidden).toEqual([]);
  });

  it('el botón Recentrar suelta el lugar elegido y vuelve al encuadre inicial', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    act(() => useHeroStore.setState({ selected: { id: 1, name: 'X', slug: 'barberias', emoji: '💈', position: [0, 0, 0] } }));
    const before = useHeroStore.getState().recenterTick;
    await userEvent.click(screen.getByRole('button', { name: 'Recentrar' }));
    expect(useHeroStore.getState().selected).toBeNull();
    expect(useHeroStore.getState().recenterTick).toBe(before + 1);
  });
});
