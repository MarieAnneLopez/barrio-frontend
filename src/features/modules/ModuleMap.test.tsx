import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ModuleItem } from '../../lib/apiTypes';
import { useFocusStore } from '../../three/camera/focusStore';
import { usePlaceScope } from '../../three/places/placeScope';
import { useSelectionStore } from '../../three/selection/selectionStore';
import { worldReady } from '../../test/emptyWorld';
import { mockApi } from '../../test/mockApi';
import { BASE_MAP, ITEMS, page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

// Un registro inventado (semilla): se lista con su etiqueta, pero no se dibuja en la maqueta.
const SAMPLE: ModuleItem = {
  id: 3, nombre: 'Colegio de ejemplo', tipo: 'colegio', source_type: 'seed', source_ref: null, verified: false,
  geometry: { type: 'Point', coordinates: [-74.156, 4.65] },
};
const ALL = [...ITEMS, SAMPLE];
const features = { body: { type: 'FeatureCollection', features: ALL.map((p) => ({ type: 'Feature', id: p.id, geometry: p.geometry, properties: p })) } };
const routes = {
  ...BASE_MAP,
  '/centros-educativos': page(ALL),
  '/centros-educativos/geojson': features,
  ...Object.fromEntries(ALL.map((item) => [`/centros-educativos/${item.id}`, { body: item }])),
};
const card = (name: string) => screen.getByRole('heading', { level: 3, name }).closest('li') as HTMLElement;

beforeEach(() => {
  worldReady();
  setViewport(true);
  mockApi(routes);
});

describe('la maqueta de la sección de un módulo', () => {
  it('muestra solo los lugares del módulo, con la búsqueda y los filtros de su lista', async () => {
    const { unmount } = renderRoute('/categorias/centros-educativos?panel=abierto');
    await screen.findByRole('list', { name: 'Lista de lugares' });
    await waitFor(() => expect(usePlaceScope.getState().collection?.features).toHaveLength(3));
    expect(usePlaceScope.getState().slug).toBe('centros-educativos');
    unmount();
    expect(usePlaceScope.getState().slug).toBeNull(); // fuera de la sección vuelven los 14 módulos
  });

  it('«Ver en el mapa» elige el lugar, abre su ficha y lleva la cámara hasta él', async () => {
    renderRoute('/categorias/centros-educativos?panel=abierto');
    await screen.findByRole('list', { name: 'Lista de lugares' });
    await userEvent.click(within(card('Colegio Codema IED')).getByRole('button', { name: 'Ver en el mapa' }));
    expect(useSelectionStore.getState().selected).toEqual({ kind: 'place', slug: 'centros-educativos', id: 2 });
    expect(within(card('Colegio Codema IED')).getByRole('button', { name: 'Seleccionado en el mapa' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('complementary', { name: 'Colegio Codema IED' })).toBeInTheDocument();
    expect(useFocusStore.getState().target).not.toBeNull();
  });

  it('un dato de ejemplo no se dibuja: su tarjeta y su ficha completa lo dicen, sin «Ver en el mapa»', async () => {
    renderRoute('/categorias/centros-educativos?panel=abierto');
    await screen.findByRole('list', { name: 'Lista de lugares' });
    const sample = card('Colegio de ejemplo');
    expect(within(sample).getByText('Dato de ejemplo: no se dibuja en la maqueta.')).toBeInTheDocument();
    expect(within(sample).queryByRole('button', { name: 'Ver en el mapa' })).toBeNull();
    await userEvent.click(within(sample).getByRole('button', { name: /Ver detalle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Colegio de ejemplo' });
    expect(await within(dialog).findByText('Dato de ejemplo: no se dibuja en la maqueta.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Ver en la maqueta' })).toBeNull();
  });

  it('la ficha completa lleva a la maqueta, no a Google Maps: «Ver en la maqueta» cierra y enfoca el lugar', async () => {
    renderRoute('/categorias/centros-educativos?panel=abierto');
    await screen.findByRole('list', { name: 'Lista de lugares' });
    await userEvent.click(within(card('IED Gabriel Betancourt Mejia Sede A')).getByRole('button', { name: /Ver detalle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'IED Gabriel Betancourt Mejia Sede A' });
    await within(dialog).findByRole('button', { name: 'Ver en la maqueta' });
    expect(document.querySelectorAll('a[href*="google"]')).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/Google|Street View/);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ver en la maqueta' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(useSelectionStore.getState().selected).toEqual({ kind: 'place', slug: 'centros-educativos', id: 1 });
    expect(useFocusStore.getState().target).not.toBeNull();
  });

  it('?enfoque=ID entra con ese lugar elegido, su ficha abierta y la cámara sobre él', async () => {
    renderRoute('/categorias/centros-educativos?enfoque=2');
    expect(await screen.findByRole('complementary', { name: 'Colegio Codema IED' })).toBeInTheDocument();
    expect(useFocusStore.getState().target).not.toBeNull();
  });
});
