import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { renderRoute, setViewport } from '../../test/renderRoute';

const SEEN = 'mini-marie:welcome-seen';
const dialog = () => screen.queryByRole('dialog', { name: 'Hola' });

beforeEach(() => {
  window.sessionStorage.removeItem(SEEN);
  setViewport(true);
  act(() => useA11yStore.getState().reset());
});

describe('Bienvenida de Mini Marie', () => {
  it('se abre en la primera visita con 8 Mini Marie, el letrero y el foco en el botón', async () => {
    renderRoute('/');

    const welcome = await screen.findByRole('dialog', { name: 'Hola' });
    expect(welcome).toHaveAttribute('aria-modal', 'true');
    expect(welcome.querySelectorAll('.avatar[data-state="wave"]')).toHaveLength(8);
    await waitFor(() => expect(screen.getByRole('button', { name: '¡Hola! Explorar El Tintal' })).toHaveFocus());
  });

  it('el botón la cierra y la sesión la recuerda (D11)', async () => {
    const { unmount } = renderRoute('/');
    await userEvent.click(await screen.findByRole('button', { name: '¡Hola! Explorar El Tintal' }));

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(window.sessionStorage.getItem(SEEN)).toBe('true');
    unmount();
    renderRoute('/');
    expect(dialog()).not.toBeInTheDocument();
  });

  it('Escape la cierra y el header permite repetirla', async () => {
    renderRoute('/');
    await screen.findByRole('dialog', { name: 'Hola' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Repetir bienvenida' }));
    expect(await screen.findByRole('dialog', { name: 'Hola' })).toBeInTheDocument();
  });

  it('se cierra sola a los 3,8 s, también con movimiento reducido', async () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    renderRoute('/');
    await screen.findByRole('dialog', { name: 'Hola' });

    await waitFor(() => expect(dialog()).not.toBeInTheDocument(), { timeout: 5000 });
  }, 8000);
});
