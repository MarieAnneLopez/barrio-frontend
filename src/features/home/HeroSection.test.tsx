import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearBaseMapCache } from '../../components/map/baseMapData';
import { useHeroStore } from '../../three/heroStore';
import { mockApi } from '../../test/mockApi';
import { BASE_MAP, FEATURES } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

// jsdom no tiene WebGL: la escena se sustituye; aquí se prueba el Hero que la envuelve.
vi.mock('../../three/TintalScene', () => ({
  default: ({ active }: { active: boolean }) => <div data-testid="escena-3d" data-active={String(active)} />,
}));

beforeEach(() => {
  window.localStorage.clear();
  clearBaseMapCache();
  setViewport(true);
  act(() => useHeroStore.setState({ paused: false, selected: null, hovered: null }));
});

describe('Hero 3D', () => {
  it('carga los datos y muestra la escena con su HUD y descripción accesible', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');

    expect(await screen.findByTestId('escena-3d')).toBeInTheDocument();
    const hero = screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' });
    expect(hero).toHaveAccessibleDescription(/manzanas, vías, parques y edificios/);
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

  it('el lugar seleccionado abre su ficha con enlace al módulo y se cierra', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
    renderRoute('/');
    await screen.findByTestId('escena-3d');

    act(() => useHeroStore.getState().select({
      id: 2, name: 'Colegio Codema IED', slug: 'centros-educativos', emoji: '🎓', position: [0, 70, 0],
    }));
    const card = screen.getByRole('region', { name: 'Lugar seleccionado' });
    expect(card).toHaveTextContent('Colegio Codema IED');
    expect(screen.getByRole('link', { name: 'Ver en Centros Educativos' })).toHaveAttribute(
      'href', '/categorias/centros-educativos',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar ficha' }));
    expect(screen.queryByRole('region', { name: 'Lugar seleccionado' })).not.toBeInTheDocument();
  });

  it('si la API aún no responde, nunca muestra un error: reintenta sola y luego dibuja', async () => {
    mockApi({ '/barrio/poligono': { status: 502, body: {} } });
    renderRoute('/');
    await new Promise((resolve) => setTimeout(resolve, 300)); // primer intento fallido

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(/No se pudo cargar/)).toBeNull();
    mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES }); // la API despertó
    expect(await screen.findByTestId('escena-3d', {}, { timeout: 4000 })).toBeInTheDocument();
  }, 8000);
});
