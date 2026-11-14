import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAvatarStore } from '../../store/avatarStore';
import { ADMIN } from '../../test/authFixtures';
import { BARBERIA, barberiaRoutes } from '../../test/engagementFixtures';
import { mockApi } from '../../test/mockApi';
import { page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

const avatar = () => useAvatarStore.getState().state;

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
  act(() => useAvatarStore.setState({ state: 'idle' }));
});

async function openDetail() {
  renderRoute('/categorias/barberias');
  await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de Barbería Kings' }));
  return screen.findByRole('dialog', { name: 'Barbería Kings' });
}

describe('Reacciones de Mini Marie a las acciones (H23)', () => {
  it('salta de alegría al guardar una calificación', async () => {
    mockApi(barberiaRoutes(() => ({ status: 201, body: {} })));
    const dialog = await openDetail();
    await userEvent.click(await within(dialog).findByRole('radio', { name: '4 estrellas' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar calificación' }));
    await waitFor(() => expect(avatar()).toBe('jump'));
  });

  it('se pone triste si la API rechaza una escritura', async () => {
    const conflict = { status: 409, body: { error: { code: 'CONFLICT', message: 'x' } } };
    mockApi({
      ...barberiaRoutes(() => ({ body: {} }), undefined, ADMIN),
      '/barberias/3': (_url: URL, init?: RequestInit) => (init?.method ? conflict : { body: BARBERIA }),
      '/barberias': page([BARBERIA]),
    });
    const dialog = await openDetail();
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Eliminar' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sí, eliminar' }));

    expect(await within(dialog).findByText('Ya existe un registro con ese código.')).toBeInTheDocument();
    expect(avatar()).toBe('sad');
  });
});
