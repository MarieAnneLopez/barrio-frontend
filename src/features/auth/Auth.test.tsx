import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, AUTH_REQUIRED, sessionAs, VISITANTE } from '../../test/authFixtures';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

const header = () => screen.getAllByRole('banner')[0] as HTMLElement;
const BAD = { status: 401, body: { error: { code: 'INVALID_CREDENTIALS', message: 'x' } } };

async function openDialog() {
  await userEvent.click(await within(header()).findByRole('button', { name: 'Iniciar sesión' }));
  return screen.findByRole('dialog', { name: 'Iniciar sesión' });
}

describe('LoginModal', () => {
  it('valida, muestra el error de la API y con éxito cierra y muestra la cuenta en el header', async () => {
    const sent: unknown[] = [];
    mockApi({
      ...sessionAs(null),
      '/auth/login': (_url, init) => {
        const body = JSON.parse(String(init?.body)) as { password: string };
        sent.push(body);
        return body.password === 'clave-correcta' ? { body: { usuario: ADMIN, expires_in: 3600 } } : BAD;
      },
    });
    renderRoute('/');
    const dialog = await openDialog();
    const submit = within(dialog).getAllByRole('button', { name: 'Iniciar sesión' }).at(-1) as HTMLElement;

    await userEvent.click(submit);
    expect(await within(dialog).findByText('Escribe un correo válido')).toBeInTheDocument();
    expect(sent).toEqual([]);

    await userEvent.type(within(dialog).getByLabelText('Correo electrónico'), '  Admin@ElTintal.local ');
    await userEvent.type(within(dialog).getByLabelText('Contraseña'), 'mala');
    await userEvent.click(submit);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');

    await userEvent.clear(within(dialog).getByLabelText('Contraseña'));
    await userEvent.type(within(dialog).getByLabelText('Contraseña'), 'clave-correcta');
    await userEvent.click(submit);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sent.at(-1)).toEqual({ email: 'admin@eltintal.local', password: 'clave-correcta' });
    expect(within(header()).getByRole('link', { name: /Administración/ })).toHaveAttribute('href', '/acceso');
  });

  it('crea una cuenta de visitante', async () => {
    let body: unknown;
    mockApi({
      ...sessionAs(null),
      '/auth/register': (_url, init) => ((body = JSON.parse(String(init?.body))), {
        status: 201, body: { usuario: VISITANTE, expires_in: 3600 } }),
    });
    renderRoute('/');
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear cuenta' }));

    await userEvent.type(within(dialog).getByLabelText('Nombre'), 'Vecina del Tintal');
    await userEvent.type(within(dialog).getByLabelText('Correo electrónico'), 'vecina@correo.co');
    await userEvent.type(within(dialog).getByLabelText('Contraseña'), 'corta');
    const submit = within(dialog).getAllByRole('button', { name: 'Crear cuenta' }).at(-1) as HTMLElement;
    await userEvent.click(submit);
    expect(await within(dialog).findByText('Mínimo 8 caracteres')).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText('Contraseña'), '-mas-larga');
    await userEvent.click(submit);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(body).toEqual({ nombre: 'Vecina del Tintal', email: 'vecina@correo.co', password: 'corta-mas-larga' });
    expect(within(header()).getByRole('link', { name: /Vecina del Tintal/ })).toBeInTheDocument();
  });

  it('recupera la sesión al cargar y el diálogo no tiene violaciones de axe', async () => {
    mockApi({ ...sessionAs(ADMIN) });
    const { unmount } = renderRoute('/');
    expect(await within(header()).findByRole('link', { name: /Administración/ })).toBeInTheDocument();
    unmount();

    mockApi({ '/auth/session': AUTH_REQUIRED });
    renderRoute('/');
    const dialog = await openDialog();
    const { default: axe } = await import('axe-core');
    const result = await axe.run(dialog, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
