import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ModuleItem } from '../../lib/apiTypes';
import { useFocusStore } from '../../three/camera/focusStore';
import { FOCUS_DISTANCE } from '../../three/camera/mapView';
import { worldReady } from '../../test/emptyWorld';
import { mockApi } from '../../test/mockApi';
import { BASE_MAP, page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

// Un parque grande del barrio (unos 670 × 440 m): a la distancia del vuelo a un punto (1 300 m, unos
// 227 m de alto en la imagen) no cabía; la cámara se aleja lo justo para verlo entero (placeFocus).
const RING = [[-74.16, 4.648], [-74.154, 4.648], [-74.154, 4.652], [-74.16, 4.652], [-74.16, 4.648]];
const PARK: ModuleItem = {
  id: 7, nombre: 'Parque grande', tipo: 'parque', source_type: 'osm', verified: true,
  source_ref: 'https://www.openstreetmap.org/way/7', geometry: { type: 'Polygon', coordinates: [RING] },
};
const ROUTES = {
  ...BASE_MAP,
  '/zonas-verdes': page([PARK]),
  '/zonas-verdes/geojson': {
    body: { type: 'FeatureCollection', features: [{ type: 'Feature', id: 7, geometry: PARK.geometry, properties: PARK }] },
  },
  '/zonas-verdes/7': { body: PARK },
};

beforeEach(() => {
  worldReady();
  setViewport(true);
  mockApi(ROUTES);
});

describe('«Ver en el mapa» encuadra la figura entera', () => {
  it('un parque grande aleja la cámara más que el vuelo a un punto', async () => {
    renderRoute('/categorias/zonas-verdes?panel=abierto');
    const card = (await screen.findByRole('heading', { level: 3, name: 'Parque grande' })).closest('li') as HTMLElement;
    await userEvent.click(within(card).getByRole('button', { name: 'Ver en el mapa' }));
    expect(useFocusStore.getState().target?.distance).toBeGreaterThan(FOCUS_DISTANCE);
  });
});
