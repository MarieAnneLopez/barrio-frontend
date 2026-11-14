import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '../i18n/i18n';
import { renderRoute, setViewport } from '../test/renderRoute';

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

afterEach(async () => {
  await act(() => i18n.changeLanguage('es'));
});

describe('Header e idioma', () => {
  it('cambia a inglés, actualiza <html lang> y lo persiste', async () => {
    renderRoute('/');
    const group = screen.getByRole('group', { name: 'Idioma' });
    expect(group).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^en/i }));
    expect(screen.getByRole('heading', { level: 1, name: /Get to Know/ })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem('mini-marie:lang')).toBe('en');
    expect(screen.getByRole('button', { name: /^en/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('ofrece saltar al contenido principal', () => {
    renderRoute('/');
    expect(screen.getByRole('link', { name: 'Saltar al contenido principal' })).toHaveAttribute(
      'href',
      '#contenido',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido');
  });
});

describe('Rutas', () => {
  it('muestra 404 para rutas y módulos inexistentes', () => {
    renderRoute('/no-existe');
    expect(screen.getByRole('heading', { level: 1, name: 'Esta página no existe' })).toBeVisible();
  });

  it('un slug de módulo desconocido también da 404', () => {
    renderRoute('/categorias/no-existe');
    expect(screen.getByRole('heading', { level: 1, name: 'Esta página no existe' })).toBeVisible();
  });
});

describe('Móvil', () => {
  it('el botón de menú abre el cajón y Escape lo cierra', async () => {
    setViewport(false);
    renderRoute('/');
    const menu = screen.getByRole('button', { name: 'Abrir menú' });
    await userEvent.click(menu);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});

describe('axe', () => {
  it('el shell no tiene violaciones (expandido y en un módulo)', async () => {
    const { container } = renderRoute('/categorias/zonas-verdes');
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
