import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModuleItem } from '../../lib/apiTypes';
import { useFocusStore } from '../../three/camera/focusStore';
import { worldReady } from '../../test/emptyWorld';
import { mockApi } from '../../test/mockApi';
import { BASE_MAP, page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

// jsdom no tiene WebGL: la escena se sustituye (si el chunk diferido llegara a cargar, r3f fallaría).
vi.mock('../../three/TintalScene', () => ({ default: () => <div data-testid="escena-3d" /> }));

// La localidad (FICHA) abarca el barrio entero y mucho más: su contorno no se dibuja en la maqueta
// (salía de la isla y flotaba sobre el cielo), así que no se ofrece «Ver en el mapa».
const KENNEDY: ModuleItem = {
  id: 1, nombre_localidad: 'Kennedy', poblacion: 1_000_000, source_type: 'datos_abiertos', verified: true,
  source_ref: 'https://datosabiertos.bogota.gov.co/dataset/localidades',
  geometry: { type: 'Polygon', coordinates: [[[-74.2, 4.6], [-74.1, 4.6], [-74.1, 4.7], [-74.2, 4.6]]] },
};
const ROUTES = {
  ...BASE_MAP,
  '/localidad': page([KENNEDY]),
  '/localidad/geojson': {
    body: { type: 'FeatureCollection', features: [{ type: 'Feature', id: 1, geometry: KENNEDY.geometry, properties: KENNEDY }] },
  },
  '/localidad/1': { body: KENNEDY },
};

beforeEach(() => {
  worldReady();
  setViewport(true);
  mockApi(ROUTES);
});

describe('la ficha de la localidad no se señala en la maqueta', () => {
  it('su tarjeta no ofrece «Ver en el mapa» y su ficha completa dice por qué', async () => {
    renderRoute('/categorias/localidad?panel=abierto');
    const card = (await screen.findByRole('heading', { level: 3, name: 'Kennedy' })).closest('li') as HTMLElement;
    expect(within(card).queryByRole('button', { name: 'Ver en el mapa' })).toBeNull();
    await userEvent.click(within(card).getByRole('button', { name: /Ver detalle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Kennedy' });
    expect(await within(dialog).findByText('Abarca el barrio entero y más: la maqueta no la señala.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Ver en la maqueta' })).toBeNull();
  });

  it('un enlace directo (?enfoque=ID) abre su ficha, pero la cámara no vuela fuera de la isla', async () => {
    const before = useFocusStore.getState().tick;
    renderRoute('/categorias/localidad?enfoque=1');
    expect(await screen.findByRole('complementary', { name: 'Kennedy' })).toBeInTheDocument();
    expect(useFocusStore.getState().tick).toBe(before);
  });
});
