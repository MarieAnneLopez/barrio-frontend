import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { renderRoute, setViewport } from '../../test/renderRoute';

const root = document.documentElement;
const rail = () => screen.getByRole('complementary', { name: 'Accesibilidad' });
const btn = (name: string) => within(rail()).getByRole('button', { name });

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
  act(() => useA11yStore.getState().reset());
});

describe('AccessibilityRail', () => {
  it('cambia el tamaño de letra en 4 niveles (90–125 %) y lo anuncia', async () => {
    renderRoute('/');
    expect(root.style.getPropertyValue('--font-scale')).toBe('1');
    await userEvent.click(btn('Aumentar tamaño de letra'));
    await userEvent.click(btn('Aumentar tamaño de letra'));
    expect(root.style.getPropertyValue('--font-scale')).toBe('1.25');
    expect(btn('Aumentar tamaño de letra')).toBeDisabled();
    expect(within(rail()).getByRole('status')).toHaveTextContent('Tamaño de letra: 125 %');
    for (let i = 0; i < 3; i++) await userEvent.click(btn('Reducir tamaño de letra'));
    expect(root.style.getPropertyValue('--font-scale')).toBe('0.9');
    expect(btn('Reducir tamaño de letra')).toBeDisabled();
  });

  it('alterna alto contraste y movimiento reducido en <html>', async () => {
    renderRoute('/');
    await userEvent.click(btn('Alto contraste'));
    expect(btn('Alto contraste')).toHaveAttribute('aria-pressed', 'true');
    expect(root).toHaveClass('high-contrast');
    await userEvent.click(btn('Reducir movimiento'));
    expect(root).toHaveClass('reduce-motion');
  });

  it('restablece todo y persiste las preferencias', async () => {
    renderRoute('/');
    await userEvent.click(btn('Alto contraste'));
    await userEvent.click(btn('Aumentar tamaño de letra'));
    const saved = JSON.parse(window.localStorage.getItem('mini-marie:a11y') ?? '{}');
    expect(saved.state).toMatchObject({ highContrast: true, scaleIndex: 2 });
    await userEvent.click(btn('Restablecer accesibilidad'));
    expect(root).not.toHaveClass('high-contrast');
    expect(root.style.getPropertyValue('--font-scale')).toBe('1');
  });

  it('en móvil se pliega en un botón con aria-expanded', async () => {
    setViewport(false);
    renderRoute('/');
    const toggle = btn('Abrir opciones de accesibilidad');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(rail()).queryByRole('button', { name: 'Alto contraste' })).toBeNull();
    await userEvent.click(toggle);
    expect(btn('Cerrar opciones de accesibilidad')).toHaveAttribute('aria-expanded', 'true');
    expect(btn('Alto contraste')).toBeVisible();
  });
});
