import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import manifest from '../../../public/data/tintal/manifest.json';
import type { ModuleItem } from '../../lib/apiTypes';
import { useFocusStore } from '../../three/camera/focusStore';
import { createProjection } from '../../three/projection';
import { worldReady } from '../../test/emptyWorld';
import { callsTo, mockApi } from '../../test/mockApi';
import { BASE_MAP, page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

const ring = [[-74.155, 4.643], [-74.154, 4.643], [-74.154, 4.644], [-74.155, 4.643]];
const LOTE: ModuleItem = {
  id: 7, codigo_lote: '004601001001', estrato: 2, area_lote_m2: 48, uso: null,
  source_type: 'datos_abiertos', verified: true,
  source_ref: 'https://datosabiertos.bogota.gov.co/dataset/lote#LOTCODIGO=004601001001',
  geometry: { type: 'Polygon', coordinates: [ring] },
};
const collection = (items: ModuleItem[]) => ({
  body: { type: 'FeatureCollection', features: items.map((i) => ({ type: 'Feature', id: i.id, geometry: i.geometry, properties: i })) },
});
const ROUTES = {
  ...BASE_MAP,
  '/datos-catastrales': page([LOTE]),
  '/datos-catastrales/geojson': collection([LOTE]),
  '/datos-catastrales/7': { body: LOTE },
};

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

describe('Módulo genérico (catastro: polígonos, sin campo "nombre")', () => {
  it('titula con el campo del módulo y traduce los datos clave', async () => {
    mockApi(ROUTES);
    renderRoute('/categorias/datos-catastrales?panel=abierto');

    const card = (await screen.findByRole('heading', { name: '004601001001' })).closest('li') as HTMLElement;
    expect(within(card).getByText('Estrato')).toBeInTheDocument();
    expect(within(card).getByText('48')).toBeInTheDocument();
    expect(within(card).queryByText('Uso')).not.toBeInTheDocument();
  });

  it('filtra por estrato con un parámetro de la API', async () => {
    const fetchMock = mockApi(ROUTES);
    renderRoute('/categorias/datos-catastrales?panel=abierto');
    await screen.findByRole('heading', { name: '004601001001' });

    await userEvent.selectOptions(screen.getByLabelText('Estrato'), '2');

    await waitFor(() => expect(callsTo(fetchMock, '/datos-catastrales').at(-1)?.get('estrato')).toBe('2'));
    expect(callsTo(fetchMock, '/datos-catastrales/geojson').at(-1)?.get('estrato')).toBe('2');
  });

  it('abre la ficha con todos los campos y la fuente enlazada', async () => {
    mockApi(ROUTES);
    renderRoute('/categorias/datos-catastrales?panel=abierto');

    await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de 004601001001' }));

    const dialog = await screen.findByRole('dialog', { name: '004601001001' });
    expect(within(dialog).getByText('Código de lote catastral')).toBeInTheDocument();
    expect(within(dialog).getByText('Datos abiertos de Bogotá')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /datosabiertos\.bogota\.gov\.co/ })).toHaveAttribute(
      'href', LOTE.source_ref,
    );
  });

  it('un lote (polígono) se elige desde la lista: ficha a la derecha y la cámara al centro del lote', async () => {
    worldReady();
    mockApi(ROUTES);
    renderRoute('/categorias/datos-catastrales?panel=abierto');
    await screen.findByRole('heading', { name: '004601001001' });
    await userEvent.click(screen.getByRole('button', { name: 'Ver en el mapa' }));
    expect(await screen.findByRole('button', { name: 'Seleccionado en el mapa' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('complementary', { name: '004601001001' })).toBeInTheDocument();
    const [x, z] = createProjection(manifest.proyeccion.bbox as [number, number, number, number])([-74.1545, 4.6435]);
    expect(useFocusStore.getState().target?.x).toBeCloseTo(x);
    expect(useFocusStore.getState().target?.z).toBeCloseTo(z);
  });
});

describe('axe', () => {
  it('filtros, lista y ficha abierta sin violaciones', async () => {
    const { default: axe } = await import('axe-core');
    mockApi(ROUTES);
    const { container } = renderRoute('/categorias/datos-catastrales?panel=abierto');
    await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de 004601001001' }));
    const dialog = await screen.findByRole('dialog', { name: '004601001001' });

    const options = { rules: { 'color-contrast': { enabled: false } } };
    for (const scope of [container, dialog]) {
      const result = await axe.run(scope, options);
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    }
  });
});
