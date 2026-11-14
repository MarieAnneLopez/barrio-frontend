import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

const nav = () => screen.getByRole('navigation', { name: 'Navegación principal' });

describe('Sidebar', () => {
  it('lista las secciones y marca la activa con aria-current', () => {
    renderRoute('/historia');
    const links = within(nav()).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(
      expect.arrayContaining(['Inicio', 'Mapa 3D', 'Historia Local', 'Acceso / Sesión']),
    );
    expect(within(nav()).getByRole('link', { name: 'Historia Local' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav()).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('se contrae, conserva nombres accesibles y recuerda la preferencia', async () => {
    const { unmount } = renderRoute('/');
    const toggle = screen.getByRole('button', { name: 'Contraer menú' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(within(nav()).getByRole('link', { name: 'Mapa 3D' })).toBeInTheDocument();
    expect(window.localStorage.getItem('mini-marie:sidebar-collapsed')).toBe('true');
    unmount();
    renderRoute('/');
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toBeInTheDocument();
  });

  it('el submenú Categorías abre los 14 módulos con teclado', async () => {
    renderRoute('/');
    const button = within(nav()).getByRole('button', { name: 'Categorías' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('list', { name: '14 módulos del barrio' });
    expect(within(list).getAllByRole('link')).toHaveLength(14);
  });

  it('contraído, abrir Categorías expande el menú', async () => {
    window.localStorage.setItem('mini-marie:sidebar-collapsed', 'true');
    renderRoute('/');
    await userEvent.click(within(nav()).getByRole('button', { name: 'Categorías' }));
    expect(screen.getByRole('button', { name: 'Contraer menú' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '14 módulos del barrio' })).toBeVisible();
  });

  it('en un módulo, el submenú aparece abierto con el módulo activo', () => {
    renderRoute('/categorias/robos');
    expect(screen.getByRole('heading', { level: 1, name: 'Datos sobre Robos' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: '14 módulos del barrio' });
    expect(within(list).getByRole('link', { name: 'Datos sobre Robos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
