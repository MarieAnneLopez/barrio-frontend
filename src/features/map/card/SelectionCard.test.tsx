import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import '../../../i18n/i18n';
import { useSelectionStore, type Selection } from '../../../three/selection/selectionStore';
import { buildingWorldReady } from '../../../test/buildingWorld';
import { mockApi } from '../../../test/mockApi';
import { FEATURES } from '../../../test/moduleFixtures';
import { SelectionCard } from './SelectionCard';

const pick = (selection: Selection | null) => act(() => useSelectionStore.getState().select(selection));
const card = (name: string | RegExp) => screen.findByRole('complementary', { name });

beforeEach(() => {
  buildingWorldReady();
  mockApi({ '/centros-educativos/geojson': FEATURES });
  pick(null);
  render(<MemoryRouter><button type="button">Antes</button><SelectionCard /></MemoryRouter>);
});

describe('ficha de un edificio (DIRT, pisos y fuentes)', () => {
  it('con nombre: el nombre es el título y la dirección dice que es la oficial', async () => {
    pick({ kind: 'building', index: 0 });
    const ficha = await card('Conjunto Torres del Parque');
    expect(within(ficha).getByText('Dirección oficial').nextElementSibling).toHaveTextContent('KR 88D # 6D-27 TO 6');
    expect(within(ficha).getByText(/^6 pisos/)).toBeInTheDocument();
    expect(within(ficha).getByRole('link', { name: 'OpenStreetMap (way/123)' })).toHaveAttribute('href', 'https://www.openstreetmap.org/way/123');
  });

  it('sin nombre, la dirección es el título, con la etiqueta de su procedencia (DIRT 2 y 3)', async () => {
    pick({ kind: 'building', index: 1 });
    expect(within(await card('KR 88D # 6D-27')).getByText('Dirección de su lote (placa más cercana)')).toBeInTheDocument();
    pick({ kind: 'building', index: 2 });
    const ficha = await card('CL 6 # 88-10');
    expect(within(ficha).getByText('Dirección aproximada (de la manzana)')).toBeInTheDocument();
    expect(within(ficha).getByText(/^Pisos sin dato/)).toBeInTheDocument(); // sin pisosConocidos: nunca un número
  });

  it('sin nombre ni placa el título nunca queda vacío', async () => {
    pick({ kind: 'building', index: 3 });
    const ficha = await card('Edificio sin dirección');
    expect(within(ficha).getByRole('link', { name: 'OpenStreetMap (way/456)' })).toBeInTheDocument();
  });

  it('cita la fuente del edificio y las del mapa, con su licencia', async () => {
    pick({ kind: 'building', index: 0 });
    const ficha = await card('Conjunto Torres del Parque');
    expect(within(ficha).getByRole('link', { name: 'Catastro (UAECD), lote 004627077011' })).toHaveAttribute(
      'href', 'https://datosabiertos.bogota.gov.co/dataset/construccion');
    // D105 y FORMATO.md §8: la cita nombra a la UAECD, enlaza la licencia CC BY 4.0 y dice que los datos están modificados.
    expect(within(ficha).getByRole('link', { name: 'Catastro Bogotá (UAECD) – Datos Abiertos Bogotá' })).toBeInTheDocument();
    expect(within(ficha).getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/deed.es');
    expect(ficha).toHaveTextContent('Catastro Bogotá (UAECD) – Datos Abiertos Bogotá, CC BY 4.0, datos modificados');
    expect(within(ficha).getByRole('link', { name: '© colaboradores de OpenStreetMap (ODbL)' })).toHaveAttribute(
      'href', 'https://www.openstreetmap.org/copyright');
  });
});

describe('ficha de un lugar y cierre', () => {
  it('lugar: nombre, datos del módulo, verificación, su fuente y la del mapa', async () => {
    pick({ kind: 'place', slug: 'centros-educativos', id: 1 });
    const ficha = await card('IED Gabriel Betancourt Mejia Sede A');
    expect(ficha.querySelector('.ui-eyebrow')).toHaveTextContent('🎓 Centros Educativos');
    expect(within(ficha).getByText('Colegio')).toBeInTheDocument();
    expect(within(ficha).getByText('Verificado')).toBeInTheDocument();
    expect(within(ficha).getByRole('link', { name: 'Ver en Centros Educativos' })).toHaveAttribute(
      'href', '/categorias/centros-educativos?enfoque=1');
    expect(within(ficha).getByText('© colaboradores de OpenStreetMap (ODbL)')).toBeInTheDocument();
  });

  it('el botón cerrar y Escape la cierran y el foco vuelve a donde estaba', async () => {
    screen.getByRole('button', { name: 'Antes' }).focus();
    pick({ kind: 'building', index: 1 });
    await card('KR 88D # 6D-27');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar ficha' }));
    expect(useSelectionStore.getState().selected).toBeNull();
    expect(screen.getByRole('button', { name: 'Antes' })).toHaveFocus();

    screen.getByRole('button', { name: 'Antes' }).blur(); // como al hacer clic en la maqueta
    pick({ kind: 'building', index: 1 });
    const ficha = await card('KR 88D # 6D-27');
    expect(within(ficha).getByRole('heading', { level: 2 })).toHaveFocus(); // abierta desde la maqueta: el foco va a ella
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('complementary')).toBeNull();
  });
});
