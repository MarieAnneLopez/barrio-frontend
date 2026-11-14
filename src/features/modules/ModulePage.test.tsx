import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { callsTo, mockApi } from '../../test/mockApi';
import { BASE_MAP, FEATURES, ITEMS, page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

const PATH = '/categorias/centros-educativos';
const list = () => screen.findByRole('list', { name: 'Lista de lugares' });
const card = (name: string) => screen.getByRole('heading', { name }).closest('li') as HTMLElement;

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

describe('Módulo Centros Educativos', () => {
  it('muestra los lugares con sus datos y estado de verificación', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos': page(ITEMS), '/centros-educativos/geojson': FEATURES });
    renderRoute(PATH);

    expect(within(await list()).getAllByRole('listitem')).toHaveLength(2);
    const sedeA = card('IED Gabriel Betancourt Mejia Sede A');
    expect(within(sedeA).getByText('Colegio')).toBeInTheDocument();
    expect(within(sedeA).getByText('Público')).toBeInTheDocument();
    expect(within(sedeA).getByText('Verificado')).toBeInTheDocument();
    expect(within(card('Colegio Codema IED')).getByText('Por verificar')).toBeInTheDocument();
    expect(screen.getByText('2 resultados')).toBeInTheDocument();
  });

  it('busca y pagina con parámetros en la API', async () => {
    const fetchMock = mockApi({
      ...BASE_MAP,
      '/centros-educativos': (url) => page(ITEMS, Number(url.searchParams.get('page')), 2),
      '/centros-educativos/geojson': FEATURES,
    });
    renderRoute(PATH);
    await list();

    await userEvent.type(screen.getByLabelText('Buscar en este módulo'), 'codema');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));

    await waitFor(() => {
      const last = callsTo(fetchMock, '/centros-educativos').at(-1);
      expect(last?.get('q')).toBe('codema');
      expect(last?.get('page')).toBe('2');
    });
  });

  it('sincroniza la lista y el mapa al seleccionar', async () => {
    mockApi({ ...BASE_MAP, '/centros-educativos': page(ITEMS), '/centros-educativos/geojson': FEATURES });
    renderRoute(PATH);
    await list();
    const map = await screen.findByRole('region', { name: 'Mapa de Centros Educativos' });
    const marker = await within(map).findByRole('button', { name: 'Colegio Codema IED' });

    await userEvent.click(marker);
    expect(marker).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Seleccionado en el mapa' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('distingue módulo sin datos (404), error con reintento y lista vacía', async () => {
    mockApi({ ...BASE_MAP });
    const { unmount } = renderRoute('/categorias/barberias');
    expect(await screen.findByText(/se cargan en la siguiente fase/)).toBeInTheDocument();
    unmount();

    let calls = 0;
    mockApi({
      ...BASE_MAP,
      '/centros-educativos': () => (++calls === 1 ? { status: 500, body: {} } : page([])),
      '/centros-educativos/geojson': FEATURES,
    });
    renderRoute(PATH);
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Este módulo todavía no tiene lugares registrados.')).toBeInTheDocument();
  });
});

describe('axe', () => {
  it('la página del módulo con lista y mapa no tiene violaciones', async () => {
    const { default: axe } = await import('axe-core');
    mockApi({ ...BASE_MAP, '/centros-educativos': page(ITEMS), '/centros-educativos/geojson': FEATURES });
    const { container } = renderRoute(PATH);
    await list();
    await screen.findByRole('button', { name: 'Colegio Codema IED' });

    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
