import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import '../../../i18n/i18n';
import { useSelectionStore } from '../../../three/selection/selectionStore';
import { buildingWorldReady } from '../../../test/buildingWorld';
import { setViewport } from '../../../test/renderRoute';
import { MapStage } from './MapStage';

// En el celular el panel es una hoja abajo que tapa el centro del mapa, donde la cámara deja lo
// elegido: al elegir algo (en la lista, en la ficha completa, con ?enfoque, en un marcador o en un
// edificio) el panel se cierra y se ven el lugar y su ficha. En pantallas anchas sigue abierto.
function renderStage() {
  return render(
    <MemoryRouter initialEntries={['/mapa?panel=abierto']}>
      <MapStage label="Maqueta 3D de El Tintal" title="Mapa 3D">
        <p>Contenido del panel</p>
      </MapStage>
    </MemoryRouter>,
  );
}
const menu = () => screen.getByRole('button', { name: 'Panel de información' });
const pick = () => act(() => useSelectionStore.getState().select({ kind: 'building', index: 0 }));

beforeEach(() => buildingWorldReady());

describe('el panel y lo elegido según el ancho de la pantalla', () => {
  it('en el celular, elegir algo cierra el panel para dejar ver el lugar y su ficha', async () => {
    setViewport(false);
    renderStage();
    expect(menu()).toHaveAttribute('aria-expanded', 'true');
    pick();
    expect(menu()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Contenido del panel')).not.toBeVisible();
    await userEvent.click(menu()); // se puede volver a abrir con la ficha abierta
    expect(menu()).toHaveAttribute('aria-expanded', 'true');
  });

  it('en pantallas anchas el panel sigue abierto junto a la ficha', () => {
    setViewport(true);
    renderStage();
    pick();
    expect(menu()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Contenido del panel')).toBeVisible();
  });
});
