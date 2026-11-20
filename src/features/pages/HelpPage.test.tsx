import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n/i18n';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  setViewport(true);
  mockApi({});
});

afterEach(async () => {
  await act(() => i18n.changeLanguage('es'));
});

describe('Ayuda (H28)', () => {
  it('explica navegación, accesibilidad, idioma, chat, cuentas, datos y contacto, con enlaces', async () => {
    renderRoute('/ayuda');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ayuda' })).toBeInTheDocument();
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual(expect.arrayContaining([
      'Navegar por el barrio', 'Accesibilidad', 'Idioma', 'Mini Marie, la asistente', 'Cuentas y permisos',
      'De dónde salen los datos', 'Contacto',
    ]));
    expect(screen.queryByText('En construcción')).not.toBeInTheDocument();
    expect(screen.getByText(/Enter abre y Escape cierra/)).toBeInTheDocument();
    const accounts = screen.getByRole('heading', { name: 'Cuentas y permisos' }).closest('summary') as HTMLElement;
    await userEvent.click(accounts);
    expect(accounts.closest('details')).toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'Ir a Acceso / Sesión' })).toHaveAttribute('href', '/acceso');
  });

  it('en inglés y sin violaciones de axe', async () => {
    await act(() => i18n.changeLanguage('en'));
    const { container } = renderRoute('/ayuda');
    expect(await screen.findByRole('heading', { level: 2, name: 'Where the data comes from' })).toBeInTheDocument();
    const { default: axe } = await import('axe-core');
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
