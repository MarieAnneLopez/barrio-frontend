import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATEGORIES } from '../../lib/categoryConfig';
import { useHeroStore } from '../../three/heroStore';
import { useSelectionStore } from '../../three/selection/selectionStore';
import { callsTo, mockApi } from '../../test/mockApi';
import { BASE_MAP, FEATURES } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';
import { worldReady } from '../../test/emptyWorld';

vi.mock('../../three/TintalScene', () => ({ default: () => <div data-testid="escena-3d" /> }));

beforeEach(() => {
  worldReady();
  setViewport(true);
  act(() => useHeroStore.setState({ hidden: [], drawn: {} }));
});

describe('Maqueta 3D con los 14 módulos (H34)', () => {
  it('pide el GeoJSON de los 14 módulos, no solo Centros Educativos', async () => {
    const fetchMock = mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    for (const { slug } of CATEGORIES) expect(callsTo(fetchMock, `/${slug}/geojson`)).toHaveLength(1);
  });

  it('la leyenda del panel muestra lo dibujado por categoría y el filtro oculta y vuelve a mostrar', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/mapa?panel=abierto');
    await screen.findByTestId('escena-3d');
    act(() => useHeroStore.getState().setDrawn({ 'centros-educativos': 5, 'datos-catastrales': 3706 }));
    const legend = screen.getByRole('list', { name: 'Leyenda y filtro' });
    expect(within(legend).getAllByRole('button')).toHaveLength(13); // la localidad no se dibuja: no se oculta
    expect(within(legend).getAllByRole('link')).toHaveLength(14);
    const lots = within(legend).getByRole('button', { name: /Datos Catastrales/ });
    expect(lots).toHaveTextContent(/3\.?706/);
    expect(within(legend).getByRole('button', { name: /Barberías/ })).toHaveTextContent('sin datos');

    await userEvent.click(lots);
    expect(lots).toHaveAttribute('aria-pressed', 'false');
    expect(useHeroStore.getState().hidden).toEqual(['datos-catastrales']);
    await userEvent.click(lots);
    expect(useHeroStore.getState().hidden).toEqual([]);
  });

  it('la localidad (ficha de toda la zona) no se dibuja: su fila lo dice y no se oculta', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/mapa?panel=abierto');
    await screen.findByTestId('escena-3d');
    act(() => useHeroStore.getState().setDrawn({ localidad: 0 }));
    const legend = screen.getByRole('list', { name: 'Leyenda y filtro' });
    expect(within(legend).queryByRole('button', { name: /Información de la Localidad/ })).toBeNull();
    const row = within(legend).getByText('Información de la Localidad').closest('li') as HTMLElement;
    expect(row).toHaveTextContent('no se dibuja');
    expect(within(row).getByRole('link', { name: /Información de la Localidad/ })).toHaveAttribute('href', '/categorias/localidad');
  });

  it('el botón Recentrar suelta lo elegido y vuelve al encuadre inicial', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    act(() => useSelectionStore.getState().select({ kind: 'place', slug: 'barberias', id: 1 }));
    const before = useHeroStore.getState().recenterTick;
    await userEvent.click(screen.getByRole('button', { name: 'Recentrar' }));
    expect(useSelectionStore.getState().selected).toBeNull();
    expect(useHeroStore.getState().recenterTick).toBe(before + 1);
  });
});
