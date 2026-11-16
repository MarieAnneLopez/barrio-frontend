import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { renderRoute, setViewport } from '../../test/renderRoute';
import { SLOTS } from './welcomePeeks';

const SEEN = 'mini-marie:welcome-seen';
const dialog = () => screen.queryByRole('dialog', { name: 'Hola' });

beforeEach(() => {
  window.sessionStorage.removeItem(SEEN);
  setViewport(true);
  act(() => useA11yStore.getState().reset());
});

describe('Bienvenida de Mini Marie', () => {
  it('se abre en la primera visita con exactamente 8 Mini Marie saludando, el letrero y el foco en el botón', async () => {
    renderRoute('/');

    const welcome = await screen.findByRole('dialog', { name: 'Hola' });
    expect(welcome).toHaveAttribute('aria-modal', 'true');
    const peeks = welcome.querySelectorAll('.welcome-peek');
    expect([...peeks].map((p) => p.getAttribute('data-slot'))).toEqual(SLOTS);
    expect(welcome.querySelectorAll('.sequence[data-sequence="wave"][data-playing]')).toHaveLength(8);
    await waitFor(() => expect(screen.getByRole('button', { name: '¡Hola! Explorar El Tintal' })).toHaveFocus());
  });

  it('en móvil también son exactamente 8: 4 esquinas y el centro de cada borde (D82)', async () => {
    setViewport(false);
    renderRoute('/');
    const welcome = await screen.findByRole('dialog', { name: 'Hola' });
    expect(welcome.querySelectorAll('.welcome-peek')).toHaveLength(8);
  });

  it('con movimiento reducido las poses quedan fijas (sin animar la tira)', async () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    renderRoute('/');
    const welcome = await screen.findByRole('dialog', { name: 'Hola' });
    expect(welcome.querySelectorAll('.sequence[data-playing]')).toHaveLength(0);
    const strip = welcome.querySelector<HTMLElement>('.welcome-peek[data-slot="top"] .sequence__strip');
    expect(strip?.style.transform).toBe('translateX(-164px)'); // cuadro 3 de 7 (2 × 82 px): brazo arriba
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
