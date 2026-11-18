import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  setViewport(true);
  mockApi({});
});

describe('Mapa 3D (/mapa)', () => {
  it('es el escenario a pantalla completa, con su título y el panel oculto tras el botón de tres barras', async () => {
    const { router, container } = renderRoute('/mapa');
    expect(await screen.findByRole('heading', { level: 1, name: 'Mapa 3D' })).toBeInTheDocument();
    expect(screen.queryByText('En construcción')).not.toBeInTheDocument();
    const stage = screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' });
    expect(stage).toHaveAttribute('data-ciclo');
    // El escenario va a todo el ancho, sin la columna de las páginas de texto.
    expect(screen.getByRole('main').className).not.toMatch(/max-w-\[1200px\]/);
    const menu = screen.getByRole('button', { name: 'Panel de información' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(router.state.location.pathname).toBe('/mapa');
    const { default: axe } = await import('axe-core');
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  it('el panel lleva la leyenda con el filtro, los enlaces a los 14 módulos y la nota de los datos', async () => {
    renderRoute('/mapa');
    await userEvent.click(await screen.findByRole('button', { name: 'Panel de información' }));
    const panel = screen.getByRole('region', { name: 'Información del mapa' });
    const legend = within(panel).getByRole('list', { name: 'Leyenda y filtro' });
    expect(within(legend).getAllByRole('button')).toHaveLength(13); // la localidad no se dibuja: no se oculta
    const links = within(legend).getAllByRole('link');
    expect(links).toHaveLength(14);
    expect(links[0]).toHaveAccessibleName('Abrir la sección de Centros Educativos');
    expect(links[0]).toHaveAttribute('href', '/categorias/centros-educativos');
    expect(within(panel).getByText(/no una unidad administrativa oficial/)).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Catastro Bogotá (UAECD) – Datos Abiertos Bogotá' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'CC BY 4.0' })).toBeInTheDocument();
  });
});
