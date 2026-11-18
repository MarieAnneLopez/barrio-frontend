import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../i18n/i18n';
import { useA11yStore } from '../../../store/a11yStore';
import { useFocusStore } from '../../../three/camera/focusStore';
import { sceneHostElement, useSceneHost } from '../../../three/sceneHost';
import { useSelectionStore } from '../../../three/selection/selectionStore';
import { CYCLE_MS } from '../../../three/sky/cycle';
import { buildingWorldReady } from '../../../test/buildingWorld';
import { MapStage } from './MapStage';

function renderStage(path = '/mapa') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MapStage label="Maqueta 3D de El Tintal" title="Mapa 3D">
        <p>Contenido del panel</p>
        <button type="button">Dentro del panel</button>
      </MapStage>
    </MemoryRouter>,
  );
}
const menu = () => screen.getByRole('button', { name: 'Panel de información' });

beforeEach(() => {
  buildingWorldReady();
  act(() => useA11yStore.setState({ reducedMotion: false }));
});

describe('escenario del mapa a pantalla completa', () => {
  it('acoge la maqueta en modo mapa y muestra el título de la sección', () => {
    renderStage();
    const stage = screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' });
    expect(stage).toHaveAttribute('data-hero');
    expect(stage.className).toMatch(/h-\[calc\(100svh-4rem\)\]/); // alto de la ventana menos el header
    expect(useSceneHost.getState().mode).toBe('mapa');
    expect(stage.contains(sceneHostElement())).toBe(true);
    expect(screen.getByRole('heading', { level: 1, name: 'Mapa 3D' })).toBeInTheDocument();
  });

  it('el botón de tres barras abre y cierra el panel, oculto al principio (aria-expanded, aria-controls)', async () => {
    renderStage();
    expect(menu()).toHaveAttribute('aria-expanded', 'false');
    expect(menu().className).toMatch(/\bsize-11\b/); // 44 × 44 px
    const panel = document.getElementById(menu().getAttribute('aria-controls') ?? '');
    expect(panel).not.toBeVisible();
    await userEvent.click(menu());
    expect(menu()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Información del mapa' })).toHaveTextContent('Contenido del panel');
    await userEvent.click(menu());
    expect(panel).not.toBeVisible();
  });

  it('Escape cierra el panel y devuelve el foco al botón', async () => {
    renderStage('/mapa?panel=abierto');
    expect(menu()).toHaveAttribute('aria-expanded', 'true');
    screen.getByRole('button', { name: 'Dentro del panel' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(menu()).toHaveAttribute('aria-expanded', 'false');
    expect(menu()).toHaveFocus();
    await userEvent.click(menu());
    await userEvent.keyboard('{Escape}'); // con el foco en el propio botón
    expect(menu()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('tono del ciclo y enlaces directos', () => {
  it('expone la fase del ciclo (data-ciclo) y, con movimiento reducido, queda de día', () => {
    vi.spyOn(Date, 'now').mockReturnValue(CYCLE_MS * 100 + 540_000); // en plena noche
    const { unmount } = renderStage();
    expect(screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' })).toHaveAttribute('data-ciclo', 'noche');
    unmount();
    act(() => useA11yStore.setState({ reducedMotion: true }));
    renderStage();
    expect(screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' })).toHaveAttribute('data-ciclo', 'dia');
    vi.restoreAllMocks();
  });

  it('?edificio=N abre la ficha de ese edificio y lleva la cámara hasta él', async () => {
    renderStage('/mapa?edificio=0');
    expect(await screen.findByRole('complementary', { name: 'Conjunto Torres del Parque' })).toBeInTheDocument();
    expect(useSelectionStore.getState().selected).toEqual({ kind: 'building', index: 0 });
    expect(useFocusStore.getState().target).toMatchObject({ x: 5, z: 5 });
  });
});
