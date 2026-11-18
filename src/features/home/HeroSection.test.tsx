import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHeroStore } from '../../three/heroStore';
import { useSceneHost } from '../../three/sceneHost';
import { useSelectionStore } from '../../three/selection/selectionStore';
import { mockApi } from '../../test/mockApi';
import { BASE_MAP, FEATURES } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';
import { worldReady } from '../../test/emptyWorld';

// jsdom no tiene WebGL: la escena se sustituye; aquí se prueba el Hero que la envuelve.
vi.mock('../../three/TintalScene', () => ({
  default: ({ active }: { active: boolean }) => <div data-testid="escena-3d" data-active={String(active)} />,
}));

beforeEach(() => {
  worldReady();
  window.localStorage.clear();
  setViewport(true);
  act(() => useHeroStore.setState({ paused: false }));
  act(() => useSelectionStore.setState({ selected: null, hovered: null }));
});

describe('Hero 3D', () => {
  it('carga los datos y muestra la escena con su HUD y descripción accesible', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');

    expect(await screen.findByTestId('escena-3d')).toBeInTheDocument();
    const hero = screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' });
    expect(hero).toHaveAccessibleDescription(/edificios de Catastro Bogotá y vías, parques y agua de OpenStreetMap/);
    expect(useSceneHost.getState().mode).toBe('cine'); // el Inicio conserva su órbita
    expect(screen.getByText('4,653° N · 74,157° O')).toBeInTheDocument();
  });

  it('la órbita automática se puede pausar y reanudar (WCAG 2.2.2)', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');
    const pause = await screen.findByRole('button', { name: 'Pausar la órbita' });

    await userEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Reanudar la órbita' })).toHaveAttribute('aria-pressed', 'true');
    expect(useHeroStore.getState().paused).toBe(true);
  });

  it('el lugar elegido en la maqueta abre su ficha (selectionStore) con enlace al módulo y se cierra', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');
    await screen.findByTestId('escena-3d');

    act(() => useSelectionStore.getState().select({ kind: 'place', slug: 'centros-educativos', id: 2 }));
    const card = await screen.findByRole('complementary', { name: 'Colegio Codema IED' });
    expect(screen.getByRole('link', { name: 'Ver en Centros Educativos' })).toHaveAttribute(
      'href', '/categorias/centros-educativos?enfoque=2',
    );
    // La ficha comparte la fila de abajo con la pista: si no caben, saltan de línea en vez de montarse.
    const hint = screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' }).querySelector('[aria-live="polite"]');
    expect(card.parentElement).toBe(hint?.parentElement);
    expect(card.className).not.toMatch(/\babsolute\b/);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar ficha' }));
    expect(screen.queryByRole('complementary', { name: 'Colegio Codema IED' })).not.toBeInTheDocument();
  });

  it('ningún panel del HUD se monta sobre otro: una columna con filas que saltan de línea', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    const hero = screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' });
    const hint = hero.querySelector('[aria-live="polite"]');
    const bottom = hint?.parentElement;
    const column = bottom?.parentElement;
    expect(column?.className).toMatch(/\bflex-col\b/);
    expect(column?.lastElementChild).toBe(bottom);
    expect(bottom?.className).toMatch(/\bmt-auto\b.*\bflex-wrap\b/);
    // Arriba, coordenadas y botones van en una fila que salta de línea: a 390 px se montaban.
    const top = column?.firstElementChild;
    expect(top?.className).toMatch(/\bflex-wrap\b/);
    expect(top?.contains(screen.getByRole('button', { name: 'Recentrar' }))).toBe(true);
    expect(top?.contains(screen.getByText('4,653° N · 74,157° O'))).toBe(true);
  });

  it('la maqueta no espera a la API: con la API dormida se dibuja igual (datos estáticos) y sin errores', async () => {
    mockApi({ '/barrio/poligono': { status: 502, body: {} } });
    renderRoute('/');

    expect(await screen.findByTestId('escena-3d')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(/No se pudo cargar/)).toBeNull();
  });
});
