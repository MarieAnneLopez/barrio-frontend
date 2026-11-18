import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CATEGORIES } from '../../lib/categoryConfig';
import { callsTo, mockApi } from '../../test/mockApi';
import { FEATURES, ITEMS, page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

// Rendimiento (D121): el módulo de lotes pesa ~4 MB sin comprimir (511 KB con brotli) y tarda ~3,5 s
// en el servidor. La maqueta solo lo dibuja con los 14 módulos (Inicio y Mapa 3D): dentro de otro
// módulo no se pide.
const geojsons = () => Object.fromEntries(CATEGORIES.map(({ slug }) => [`/${slug}/geojson`, FEATURES]));

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

describe('la maqueta pide los módulos densos solo cuando muestra los 14', () => {
  it('dentro de Centros Educativos no pide los lotes ni los tramos de calle', async () => {
    const fetchMock = mockApi({ ...geojsons(), '/centros-educativos': page(ITEMS) });
    renderRoute('/categorias/centros-educativos?panel=abierto');
    await screen.findByRole('list', { name: 'Lista de lugares' });
    await waitFor(() => expect(callsTo(fetchMock, '/zonas-verdes/geojson')).toHaveLength(1));
    expect(callsTo(fetchMock, '/datos-catastrales/geojson')).toHaveLength(0);
    expect(callsTo(fetchMock, '/estado-calles/geojson')).toHaveLength(0);
  });

  it('en Mapa 3D sí los pide, con los demás', async () => {
    const fetchMock = mockApi(geojsons());
    renderRoute('/mapa?panel=abierto');
    await waitFor(() => expect(callsTo(fetchMock, '/datos-catastrales/geojson')).toHaveLength(1));
    expect(callsTo(fetchMock, '/estado-calles/geojson')).toHaveLength(1);
    expect(callsTo(fetchMock, '/zonas-verdes/geojson')).toHaveLength(1);
  });
});
