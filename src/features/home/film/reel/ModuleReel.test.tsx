import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import i18n from '../../../../i18n/i18n';
import { CATEGORIES, categoryPath } from '../../../../lib/categoryConfig';
import { ModuleReel } from './ModuleReel';

// jsdom no tiene WebGL: aquí se prueba el respaldo, que es lo que ve quien tampoco lo tiene.
function renderReel() {
  const router = createMemoryRouter([
    { path: '/', element: <main><ModuleReel /></main> },
    { path: '/categorias/:slug', element: <p>módulo abierto</p> },
  ]);
  return { router, ...render(<RouterProvider router={router} />) };
}
const grid = () => screen.getByRole('navigation', { name: 'Los 14 módulos del barrio' });

afterEach(async () => {
  await act(() => i18n.changeLanguage('es'));
});

describe('ModuleReel sin WebGL: rejilla de respaldo', () => {
  it('la sección es el capítulo 4, en tono papel y con el header flotando encima', () => {
    const { container } = renderReel();
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('data-chapter', '4');
    expect(section).toHaveAttribute('data-tone', 'papel');
    expect(section).toHaveAttribute('data-header-float');
    expect(section).toHaveAttribute('data-mode', 'grid');
    expect(section).toHaveClass('reel', 'tone-papel');
  });

  it('enlaza los 14 módulos, en orden, con su número, su nombre y su ruta', () => {
    renderReel();
    const links = within(grid()).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(CATEGORIES.map((category) => categoryPath(category.slug)));
    expect(links[0]).toHaveAccessibleName('01 Centros Educativos');
    expect(links[10]).toHaveAccessibleName('11 Información de la Localidad');
    expect(links[13]).toHaveAccessibleName('14 Barberías');
    expect(within(grid()).getAllByRole('listitem')).toHaveLength(14);
  });

  it('titular con el nombre corto, sin h1 ni lienzo ni pista de arrastre', () => {
    const { container } = renderReel();
    expect(screen.getByRole('heading', { level: 2, name: 'El Tintal' })).toHaveClass('reel-title');
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Los 14 módulos del barrio' })).toBeNull();
    expect(screen.queryByText('Desplaza o arrastra para explorar')).toBeNull();
  });

  it('cada enlace lleva a su módulo', async () => {
    const { router } = renderReel();
    await userEvent.click(within(grid()).getByRole('link', { name: '09 Librerías' }));
    expect(router.state.location.pathname).toBe('/categorias/librerias');
    expect(screen.getByText('módulo abierto')).toBeInTheDocument();
  });

  it('en inglés usa los nombres traducidos', async () => {
    renderReel();
    await act(() => i18n.changeLanguage('en'));
    const nav = screen.getByRole('navigation', { name: 'The 14 neighborhood modules' });
    expect(within(nav).getAllByRole('link')[0]).toHaveAccessibleName('01 Schools');
  });

  it('axe: sin violaciones', async () => {
    const { default: axe } = await import('axe-core');
    const { container } = renderReel();
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });
});
