import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModuleItem } from '../../lib/apiTypes';
import { useSelectionStore } from '../../three/selection/selectionStore';
import { ADMIN } from '../../test/authFixtures';
import { worldReady } from '../../test/emptyWorld';
import { BARBERIA, barberiaRoutes } from '../../test/engagementFixtures';
import { callsTo, mockApi } from '../../test/mockApi';
import { page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

// jsdom no tiene WebGL: la escena se sustituye (si el chunk diferido llegara a cargar, r3f fallaría).
vi.mock('../../three/TintalScene', () => ({ default: () => <div data-testid="escena-3d" /> }));

// La ficha de la derecha busca el lugar en la lista del módulo y, si no está, en los datos de los 14
// módulos que la maqueta pide una vez por sesión: tras borrarlo seguía mostrando el registro borrado
// (y «Ver ficha completa» abría un 404). Borrado el lugar, su ficha se cierra y la maqueta se pone al día.
const NOT_FOUND = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Not Found' } } };
const geojson = (items: ModuleItem[]) => ({
  body: { type: 'FeatureCollection', features: items.map((p) => ({ type: 'Feature', id: p.id, geometry: p.geometry, properties: p })) },
});

beforeEach(() => {
  window.localStorage.clear();
  worldReady();
  setViewport(true);
});

describe('borrar un lugar con su ficha abierta', () => {
  it('la ficha se cierra (no queda el registro borrado) y la maqueta vuelve a pedir los lugares', async () => {
    let deleted = false;
    const fetchMock = mockApi({
      ...barberiaRoutes(() => ({ body: {} }), undefined, ADMIN),
      '/barberias': () => page(deleted ? [] : [BARBERIA]),
      '/barberias/geojson': () => geojson(deleted ? [] : [BARBERIA]),
      '/barberias/3': (_url: URL, init?: RequestInit) => {
        if (init?.method !== 'DELETE') return deleted ? NOT_FOUND : { body: BARBERIA };
        deleted = true;
        return { body: {} };
      },
    });
    const ofTheModel = () => callsTo(fetchMock, '/barberias/geojson').filter((params) => !params.has('sort'));
    renderRoute('/categorias/barberias?panel=abierto');
    const card = (await screen.findByRole('heading', { level: 3, name: 'Barbería Kings' })).closest('li') as HTMLElement;
    await userEvent.click(within(card).getByRole('button', { name: 'Ver en el mapa' }));
    expect(await screen.findByRole('complementary', { name: 'Barbería Kings' })).toBeInTheDocument();
    await waitFor(() => expect(ofTheModel()).toHaveLength(1));

    await userEvent.click(within(card).getByRole('button', { name: /Ver detalle/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(useSelectionStore.getState().selected).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'Barbería Kings' })).toBeNull();
    await waitFor(() => expect(ofTheModel()).toHaveLength(2));
  });
});
