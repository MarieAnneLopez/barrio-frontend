import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

describe('Créditos: datos de los mapas (D105)', () => {
  it('cita a Catastro Bogotá y a OpenStreetMap con sus licencias, sus conjuntos y que hay cambios', async () => {
    setViewport(true);
    mockApi({ '/fotos': { body: { items: [], total: 0, page: 1, size: 100, pages: 1 } } });
    renderRoute('/creditos-fotos');
    const section = await screen.findByRole('region', { name: 'Datos de los mapas' });
    const link = (name: string | RegExp) => within(section).getByRole('link', { name });

    expect(link('Catastro Bogotá – Datos Abiertos Bogotá (licencia abierta)')).toHaveAttribute(
      'href', 'https://datosabiertos.bogota.gov.co/dataset/construccion');
    expect(within(section).getByText(/Unidad Administrativa Especial de Catastro Distrital/)).toBeInTheDocument();
    expect(link('Creative Commons Atribución 4.0 (CC BY 4.0)')).toHaveAttribute(
      'href', 'https://creativecommons.org/licenses/by/4.0/deed.es');
    for (const [name, id] of [['Construcción', 'construccion'], ['Lote', 'lote'], ['Placa domiciliaria', 'placa-domiciliaria'], ['Sector catastral', 'sector-catastral']]) {
      expect(link(name ?? '')).toHaveAttribute('href', `https://datosabiertos.bogota.gov.co/dataset/${id}`);
    }
    expect(within(section).getByText(/Datos modificados/)).toBeInTheDocument();

    expect(link('© colaboradores de OpenStreetMap (ODbL)')).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
    expect(link('Open Database License 1.0 (ODbL)')).toHaveAttribute('href', 'https://opendatacommons.org/licenses/odbl/1-0/');
    for (const a of within(section).getAllByRole('link')) {
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a.getAttribute('href')).not.toMatch(/google/);
    }
  });
});
