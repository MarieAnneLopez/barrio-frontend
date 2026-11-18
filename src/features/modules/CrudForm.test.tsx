import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN } from '../../test/authFixtures';
import { BARBERIA, barberiaRoutes } from '../../test/engagementFixtures';
import { callsTo, mockApi, type MockResponse } from '../../test/mockApi';
import { page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

type Sent = { method: string | undefined; path: string; body: unknown };

/** Rutas de la barbería que además registran las escrituras. */
function writableRoutes(sent: Sent[], answer: MockResponse = { status: 201, body: BARBERIA }) {
  const record = (url: URL, init?: RequestInit) => {
    sent.push({ method: init?.method, path: url.pathname, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return answer;
  };
  const routes = barberiaRoutes(() => ({ body: {} }), undefined, ADMIN);
  return {
    ...routes,
    '/barberias': (url: URL, init?: RequestInit) => (init?.method ? record(url, init) : page([BARBERIA])),
    '/barberias/3': (url: URL, init?: RequestInit) => (init?.method ? record(url, init) : { body: BARBERIA }),
  };
}

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

describe('Crear, editar y eliminar', () => {
  it('crea con validación y vuelve a pedir la lista', async () => {
    const sent: Sent[] = [];
    const fetchMock = mockApi(writableRoutes(sent));
    renderRoute('/categorias/barberias?panel=abierto');

    await userEvent.click(await screen.findByRole('button', { name: 'Agregar lugar' }));
    const form = await screen.findByRole('dialog', { name: 'Agregar lugar' });
    await userEvent.click(within(form).getByRole('button', { name: 'Crear' }));
    expect(await within(form).findByText('Este campo es obligatorio')).toBeInTheDocument();
    expect(sent).toEqual([]);

    await userEvent.type(within(form).getByLabelText('Nombre *'), 'Barbería Nueva');
    await userEvent.type(within(form).getByLabelText('Longitud *'), '-74.156');
    await userEvent.type(within(form).getByLabelText('Latitud *'), '4.65');
    await userEvent.click(within(form).getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sent[0]).toEqual({ method: 'POST', path: '/api/v1/barberias', body: {
      nombre: 'Barbería Nueva', direccion: null, horario: null, servicios: null,
      geometry: { type: 'Point', coordinates: [-74.156, 4.65] } } });
    expect(callsTo(fetchMock, '/barberias').length).toBeGreaterThanOrEqual(3);
  });

  it('si la sesión vence (401) abre el diálogo para iniciarla de nuevo', async () => {
    mockApi(writableRoutes([], { status: 401, body: { error: { code: 'AUTH_REQUIRED', message: 'x' } } }));
    renderRoute('/categorias/barberias?panel=abierto');
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar lugar' }));
    const form = await screen.findByRole('dialog', { name: 'Agregar lugar' });

    await userEvent.type(within(form).getByLabelText('Nombre *'), 'X1');
    await userEvent.type(within(form).getByLabelText('Longitud *'), '-74.156');
    await userEvent.type(within(form).getByLabelText('Latitud *'), '4.65');
    await userEvent.click(within(form).getByRole('button', { name: 'Crear' }));

    expect(await screen.findByRole('dialog', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar lugar' })).not.toBeInTheDocument();
  });

  it('edita desde la ficha con los datos precargados y elimina con confirmación', async () => {
    const sent: Sent[] = [];
    mockApi(writableRoutes(sent, { body: BARBERIA }));
    renderRoute('/categorias/barberias?panel=abierto');
    await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de Barbería Kings' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    const form = await screen.findByRole('dialog', { name: 'Editar lugar' });
    const name = within(form).getByLabelText('Nombre *');
    expect(name).toHaveValue('Barbería Kings');
    await userEvent.clear(name);
    await userEvent.type(name, 'Kings Barber');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(sent[0]?.method).toBe('PATCH'));
    expect(sent[0]?.body).toMatchObject({ nombre: 'Kings Barber', servicios: 'Corte, barba' });

    await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de Barbería Kings' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(sent.at(-1)).toEqual({ method: 'DELETE', path: '/api/v1/barberias/3', body: undefined }));
  });
});
