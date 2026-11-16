import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES } from '../../lib/navigation';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

const panel = () => screen.queryByRole('navigation', { name: 'Navegación principal' });
const open = () => userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

describe('Menú desplegable del header (etapa 2)', () => {
  it('cerrado por defecto: el botón dice «Menú» y declara el panel que controla', () => {
    renderRoute('/');
    const button = screen.getByRole('button', { name: 'Abrir menú' });
    expect(button).toHaveTextContent('Menú');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'menu-principal');
    expect(panel()).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'Navegación principal' })).toBeNull(); // ya no hay barra lateral
  });

  it('abre las rutas en el orden de navigation.ts, con las 14 categorías y la página activa marcada', async () => {
    renderRoute('/historia');
    await open();
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
    const nav = panel() as HTMLElement;
    expect(nav).toHaveAttribute('id', 'menu-principal');
    const paths = [...NAV_BEFORE_CATEGORIES.map((item) => item.path), ...CATEGORIES.map((c) => categoryPath(c.slug)),
      ...NAV_AFTER_CATEGORIES.map((item) => item.path)];
    expect(within(nav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(paths);
    expect(within(within(nav).getByRole('list', { name: 'Categorías' })).getAllByRole('link')).toHaveLength(14);
    expect(within(nav).getByRole('link', { name: 'Historia Local' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('el foco entra al panel, queda atrapado en él y Escape lo devuelve al botón', async () => {
    renderRoute('/');
    await open();
    const links = within(panel() as HTMLElement).getAllByRole('link');
    expect(links[0]).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(links.at(-1)).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(panel()).toBeNull();
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveFocus();
  });

  it('se cierra al navegar y al hacer clic fuera', async () => {
    renderRoute('/');
    await open();
    await userEvent.click(within(panel() as HTMLElement).getByRole('link', { name: 'Ayuda' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ayuda' })).toBeInTheDocument();
    expect(panel()).toBeNull();
    await open();
    await userEvent.click(screen.getByTestId('menu-veil'));
    expect(panel()).toBeNull();
  });

  it('en pantallas estrechas, idioma, cuenta y repetir bienvenida van dentro del panel', async () => {
    setViewport(false);
    renderRoute('/');
    expect(screen.queryByRole('group', { name: 'Idioma' })).toBeNull();
    await open();
    const nav = panel() as HTMLElement;
    expect(within(nav).getByRole('group', { name: 'Idioma' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Repetir bienvenida' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('el header nace en tono noche y sin flotar', () => {
    renderRoute('/');
    const header = document.querySelector('header.site-header');
    expect(header).toHaveAttribute('data-tone', 'noche');
    expect(header).not.toHaveAttribute('data-float');
  });
});
