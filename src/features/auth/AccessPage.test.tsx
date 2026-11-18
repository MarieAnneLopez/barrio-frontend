import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, sessionAs, VISITANTE } from '../../test/authFixtures';
import { barberiaRoutes } from '../../test/engagementFixtures';
import { callsTo, mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

describe('/acceso y botones por rol', () => {
  it('muestra la cuenta, lo que permite su rol y cierra la sesión', async () => {
    const fetchMock = mockApi({ ...sessionAs(ADMIN), '/auth/logout': { body: {} } });
    renderRoute('/acceso');

    expect(await screen.findByText('admin@eltintal.local')).toBeInTheDocument();
    expect(screen.getByText(/crear, editar y eliminar lugares en los 14 módulos/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(screen.queryByText('admin@eltintal.local')).not.toBeInTheDocument());
    expect(callsTo(fetchMock, '/auth/logout')).toHaveLength(1);
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
  });

  it('sin sesión o como visitante no muestra crear, editar ni eliminar', async () => {
    for (const user of [null, VISITANTE]) {
      mockApi(barberiaRoutes(() => ({ body: {} }), undefined, user));
      const { unmount } = renderRoute('/categorias/barberias?panel=abierto');
      await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de Barbería Kings' }));
      expect(await screen.findByRole('dialog', { name: 'Barbería Kings' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Agregar lugar' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
      unmount();
    }
  });

  it('con la cuenta de administración aparecen los botones de escritura', async () => {
    mockApi(barberiaRoutes(() => ({ body: {} }), undefined, ADMIN));
    renderRoute('/categorias/barberias?panel=abierto');

    expect(await screen.findByRole('button', { name: 'Agregar lugar' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de Barbería Kings' }));
    expect(await screen.findByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });
});
