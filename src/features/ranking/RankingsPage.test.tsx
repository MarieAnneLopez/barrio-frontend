import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RankingEntry } from '../../lib/apiTypes';
import { barberiaRoutes } from '../../test/engagementFixtures';
import { callsTo, mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

const GLOBAL: RankingEntry[] = [
  { categoria_slug: 'veterinarias', objeto_id: 5, nombre: 'Vet Tintal', promedio: 5, total: 1 },
  { categoria_slug: 'barberias', objeto_id: 3, nombre: 'Barbería Kings', promedio: 4.25, total: 2 },
];

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

describe('Ranking', () => {
  it('lista el global en orden con estrellas, categoría y enlace a la ficha', async () => {
    mockApi({ '/ranking': { body: GLOBAL } });
    renderRoute('/ranking');

    const list = await screen.findByRole('list', { name: 'Lugares mejor calificados' });
    const [first, second] = within(list).getAllByRole('listitem');
    expect(within(first as HTMLElement).getByText('Puesto 1')).toBeInTheDocument();
    expect(within(first as HTMLElement).getByRole('link', { name: 'Vet Tintal' })).toHaveAttribute(
      'href', '/categorias/veterinarias?lugar=5',
    );
    expect(within(second as HTMLElement).getByRole('img', { name: '4,25 de 5 estrellas' })).toBeInTheDocument();
    expect(within(second as HTMLElement).getByText(/Barberías/)).toBeInTheDocument();
  });

  it('filtra por categoría y avisa cuando no hay calificaciones', async () => {
    const fetchMock = mockApi({ '/ranking': { body: GLOBAL }, '/librerias/ranking': { body: [] } });
    renderRoute('/ranking');
    await screen.findByRole('list', { name: 'Lugares mejor calificados' });

    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'librerias');

    expect(await screen.findByText('Todavía no hay lugares calificados en esta categoría.')).toBeInTheDocument();
    expect(callsTo(fetchMock, '/librerias/ranking')[0]?.get('limit')).toBe('20');
  });

  it('el enlace ?lugar= abre la ficha del lugar en su módulo', async () => {
    mockApi(barberiaRoutes(() => ({ body: {} })));
    renderRoute('/categorias/barberias?lugar=3');

    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Barbería Kings' })).toBeInTheDocument());
  });

  it('no tiene violaciones de axe', async () => {
    const { default: axe } = await import('axe-core');
    mockApi({ '/ranking': { body: GLOBAL } });
    const { container } = renderRoute('/ranking');
    await screen.findByRole('list', { name: 'Lugares mejor calificados' });

    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
