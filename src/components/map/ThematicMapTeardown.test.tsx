import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ModuleItem } from '../../lib/apiTypes';
import { Map } from '../../test/maplibreMapMock';
import { mockApi } from '../../test/mockApi';
import { BASE_MAP, page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

// H31 (D67): al salir de un módulo con figuras, el mapa se destruía antes de que
// useShapes quitara su fuente y fallaba con «reading 'removeSource'».
const ring = [[-74.155, 4.643], [-74.154, 4.643], [-74.154, 4.644], [-74.155, 4.643]];
const ZONA: ModuleItem = {
  id: 3, nombre: 'Parque de prueba', source_type: 'osm', verified: true,
  source_ref: 'https://www.openstreetmap.org/way/1', geometry: { type: 'Polygon', coordinates: [ring] },
};
const ROUTES = {
  ...BASE_MAP,
  '/zonas-verdes': page([ZONA]),
  '/zonas-verdes/geojson': {
    body: { type: 'FeatureCollection', features: [{ type: 'Feature', id: 3, geometry: ZONA.geometry, properties: ZONA }] },
  },
};

beforeEach(() => setViewport(true));

describe('Mapa temático: salir de un módulo con figuras (regresión H31)', () => {
  it('navegar a otra sección no rompe la página', async () => {
    mockApi(ROUTES);
    const { router } = renderRoute('/categorias/zonas-verdes');
    await waitFor(() => expect(Map.instances.at(-1)?.layers).toContain('modulo-relleno'));
    const map = Map.instances.at(-1) as Map;

    await act(() => router.navigate('/ayuda'));

    expect(await screen.findByRole('heading', { level: 1, name: 'Ayuda' })).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected Application Error/)).not.toBeInTheDocument();
    expect(map.style).toBeNull(); // el mapa sí se destruyó, y antes se limpiaron sus capas
  });

  it('con el mapa vivo, quita las capas antes que la fuente', async () => {
    mockApi({ ...ROUTES, '/zonas-verdes': page([]) });
    const { router } = renderRoute('/categorias/zonas-verdes');
    await waitFor(() => expect(Map.instances.at(-1)?.sources).toHaveProperty('modulo-figuras'));
    const map = Map.instances.at(-1) as Map;
    const style = map.style;
    map.remove = () => undefined; // un mapa que sigue vivo al desmontar las figuras
    await act(() => router.navigate('/ayuda'));
    expect(map.style).toBe(style);
    expect(map.layers).toEqual([]);
    expect(map.sources).not.toHaveProperty('modulo-figuras');
  });
});
