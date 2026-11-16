import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

// La barra lateral dejó de usarse en la etapa 2: la reemplaza el menú del header (SiteMenu.test.tsx).
// El componente sigue en el repositorio hasta que se autorice borrarlo; aquí solo se comprueba que
// todavía funciona suelto.
const renderSidebar = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar id="menu-lateral" collapsed={false} onToggleCollapsed={() => undefined} onExpand={() => undefined} />
    </MemoryRouter>,
  );
const nav = () => screen.getByRole('navigation', { name: 'Navegación principal' });

describe('Sidebar (sin uso desde la etapa 2)', () => {
  it('lista las secciones y marca la activa con aria-current', () => {
    renderSidebar('/historia');
    expect(within(nav()).getByRole('link', { name: 'Historia Local' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav()).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('el submenú Categorías abre los 14 módulos', async () => {
    renderSidebar('/');
    await userEvent.click(within(nav()).getByRole('button', { name: 'Categorías' }));
    expect(within(screen.getByRole('list', { name: '14 módulos del barrio' })).getAllByRole('link')).toHaveLength(14);
  });
});
