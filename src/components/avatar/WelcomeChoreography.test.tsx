import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { renderRoute, setViewport } from '../../test/renderRoute';
import { SLOTS } from './welcomePeeks';

const SEEN = 'mini-marie:welcome-seen';
const dialog = () => screen.queryByRole('dialog', { name: 'Hola' });
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'welcome.css'), 'utf8');

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

  it.each([
    ['escritorio', true, '100px', '160px', '74px'],
    ['móvil', false, '50px', '80px', '37px'],
  ])('en %s son exactamente 8 a escala entera: tamaño fijo y asomo en píxeles enteros (D86)', async (_view, desktop, width, height, rise) => {
    setViewport(desktop);
    renderRoute('/');
    const welcome = await screen.findByRole('dialog', { name: 'Hola' });
    const peeks = [...welcome.querySelectorAll<HTMLElement>('.welcome-peek')];
    expect(peeks).toHaveLength(8);
    for (const peek of peeks) {
      const box = peek.querySelector<HTMLElement>('.sequence');
      expect([box?.style.width, box?.style.height]).toEqual([width, height]);
      expect(peek.style.getPropertyValue('--peek-rise')).toBe(rise); // 46 % del alto, redondeado
    }
  });

  it('su estilo va en la interfaz nueva: sin violeta, fuente de píxel ni sombras (D84)', () => {
    expect(css).not.toMatch(/--palette-|--ff-pixel|shadow|gradient|clamp\(96px/);
    expect(css).toMatch(/\.welcome-sign \{[^}]*font-family: var\(--ff-display\)/);
    // Confeti con tokens semánticos: en alto contraste también pasa a blanco y negro.
    for (const token of ['--text-highlight', '--text-primary', '--border-ink']) expect(css).toContain(`var(${token})`);
    expect(css).not.toMatch(/var\(--c-/);
  });

  it('con movimiento reducido las poses quedan fijas (sin animar el atlas)', async () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    renderRoute('/');
    const welcome = await screen.findByRole('dialog', { name: 'Hola' });
    expect(welcome.querySelectorAll('.sequence[data-playing]')).toHaveLength(0);
    const top = (part: string) => welcome.querySelector<HTMLElement>(`.welcome-peek[data-slot="top"] ${part}`)?.style.transform;
    // tercera pose fija (brazo arriba, chispa) = cuadro 11 del ciclo: columna 2 (2 × 116 px), fila 1 (160 px)
    expect([top('.sequence__strip'), top('.sequence__rows')]).toEqual(['translateX(-232px)', 'translateY(-160px)']);
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
